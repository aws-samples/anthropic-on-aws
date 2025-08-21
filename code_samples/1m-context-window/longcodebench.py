# ABOUTME: LongCodeQA implementation for evaluating Claude Sonnet 4's long-context coding abilities
# ABOUTME: Implements LongCodeQA (code comprehension) task with multiple-choice questions

import boto3
import json
import os
import time
import pandas as pd
from typing import Dict, List, Tuple, Optional
from botocore.config import Config
from datetime import datetime
from datasets import load_dataset
import re

class LongCodeBench:
    """
    LongCodeQA implementation for evaluating long-context coding abilities.
    
    Supports code comprehension through multiple-choice questions about large codebases.
    """
    
    def __init__(self, config_file: str = 'config_lcb.json'):
        # Load configuration
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        # Set AWS configuration
        os.environ['AWS_PROFILE'] = self.config['aws']['profile']
        os.environ['AWS_DEFAULT_REGION'] = self.config['aws']['region']
        
        # Configure Bedrock client
        config = Config(
            read_timeout=self.config['aws']['timeout'],
            retries=dict(max_attempts=self.config['aws']['max_retries'])
        )
        
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=self.config['aws']['region'],
            config=config
        )
        
        # Context length bins from config
        self.context_bins = self.config['longcodebench']['context_bins']
        
        # Mapping from bin size to descriptive range names
        self.bin_names = {
            32000: "≤32K",
            64000: "32K-64K", 
            128000: "64K-128K",
            256000: "128K-256K",
            512000: "256K-512K", 
            1000000: "512K-1M"
        }
        
        # Load the LongCodeBench dataset components
        print("Loading LongCodeBench dataset...")
        
        # Load LongCodeQA (this works)
        try:
            print("  Loading LongCodeQA...")
            self.qa_dataset = load_dataset("Steefano/LCB", data_files="LongCodeQA.zip")
            print(f"  LongCodeQA splits: {list(self.qa_dataset.keys())}")
        except Exception as e:
            print(f"  Error loading LongCodeQA: {e}")
            self.qa_dataset = None
        
        
        # Parse and organize the dataset
        self.qa_data = {}
        self._organize_dataset()
        
    def _organize_dataset(self):
        """Organize dataset by task type and context length."""
        
        # Organize LongCodeQA data
        if self.qa_dataset:
            for split_name, split_data in self.qa_dataset.items():
                print(f"  Processing QA split: {split_name} ({len(split_data)} examples)")
                print(f"  Counting tokens for accurate binning...")
                excluded_count = 0
                
                for i, example in enumerate(split_data):
                    # Show progress every 10 examples
                    if i % 10 == 0:
                        print(f"    Processing example {i+1}/{len(split_data)}...")
                    
                    # Show detailed progress for first few examples
                    show_details = i < 5
                    if show_details:
                        repo_name = example.get('repo', 'unknown')
                        print(f"      Example {i+1} ({repo_name}):")
                    
                    context_length = self._estimate_context_length(example, show_progress=show_details)
                    context_bin = self._get_context_bin(context_length)
                    
                    # Skip examples that exceed 1M tokens (model can't handle them)
                    if context_bin is None:
                        excluded_count += 1
                        if show_details:
                            print(f"        Skipping example - {context_length:,} tokens exceeds 1M limit")
                        continue
                    
                    if context_bin not in self.qa_data:
                        self.qa_data[context_bin] = []
                    self.qa_data[context_bin].append(example)
                
                if excluded_count > 0:
                    print(f"  Excluded {excluded_count} examples that exceed 1M token limit")
        
        
        # Print dataset statistics
        self._print_dataset_stats()
    
    def _estimate_context_length(self, example: Dict, show_progress: bool = False) -> int:
        """Get actual context length using Anthropic's token counting API."""
        # Try different possible fields for repository content
        repo_content = (example.get('repo_text', '') or 
                       example.get('repository', '') or 
                       example.get('repo', '') or
                       example.get('prompt', ''))
        
        # Use Anthropic's API for accurate token counting
        return self.count_tokens(repo_content, show_progress=show_progress)
    
    def _get_context_bin(self, context_length: int) -> Optional[int]:
        """Find the appropriate context bin for a given context length."""
        # Define the actual ranges for each bin
        bin_ranges = {
            32000: (0, 32000),
            64000: (32001, 64000),
            128000: (64001, 128000),
            256000: (128001, 256000),
            512000: (256001, 512000),
            1000000: (512001, 1000000)
        }
        
        # Only check bins that are in our configuration
        for bin_size in self.context_bins:
            if bin_size in bin_ranges:
                min_tokens, max_tokens = bin_ranges[bin_size]
                if min_tokens <= context_length <= max_tokens:
                    return bin_size
        
        return None  # Exclude examples that don't fit in configured bins
    
    def _print_dataset_stats(self):
        """Print dataset distribution statistics."""
        print("\nLongCodeQA distribution by context bins:")
        for bin_size in sorted(self.qa_data.keys()):
            count = len(self.qa_data[bin_size])
            bin_name = self.bin_names.get(bin_size, f"{bin_size:,}")
            print(f"  {bin_name} tokens: {count} examples")
        
    
    def count_tokens(self, text: str, show_progress: bool = False) -> int:
        """Count tokens using Anthropic's dedicated token counting API. Bedrock doesn't provide this yet."""
        try:
            import anthropic
            
            if show_progress:
                char_count = len(text)
                print(f"        Counting tokens for {char_count:,} characters...", end=" ")
            
            # Use Anthropic's token counting API (not model invocation)
            client = anthropic.Anthropic()
            
            # Map Bedrock model ID to Anthropic API model name
            anthropic_model = "claude-sonnet-4-20250514"
            
            token_count = client.beta.messages.count_tokens(
                model=anthropic_model,
                messages=[
                    {
                        "role": "user",
                        "content": text
                    }
                ]
            )
            
            result = token_count.input_tokens
            if show_progress:
                print(f"{result:,} tokens")
            
            return result
            
        except Exception as e:
            if show_progress:
                print(f"FAILED ({e})")
            print(f"Warning: Token counting failed ({e}), falling back to estimation")
            # Fallback to character-based estimation with adjusted ratio for code (3:1 from our analysis)
            return len(text) // 3  # Better ratio for code than 4:1
    
    def invoke_claude_sonnet4(self, prompt: str, max_tokens: int = 1000) -> Tuple[str, Dict]:
        """Invoke Claude Sonnet 4 via Amazon Bedrock."""
        try:
            # Always include the 1M context beta header for long context support
            response = self.bedrock.converse(
                modelId=self.config['model']['model_id'],
                messages=[
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                inferenceConfig={
                    "maxTokens": max_tokens,
                    "temperature": self.config['model']['temperature'],
                    "topP": self.config['model']['top_p']
                },
                additionalModelRequestFields={
                    "anthropic_beta": ["context-1m-2025-08-07"]  # Hardcode to ensure it's always applied
                }
            )
            
            response_text = response['output']['message']['content'][0]['text']
            token_usage = response.get('usage', {})
            
            return response_text.strip(), token_usage
            
        except Exception as e:
            print(f"Error invoking Claude Sonnet 4: {e}")
            return "", {}
    
    def run_longcodeqa_example(self, example: Dict) -> Dict:
        """Run a single LongCodeQA example."""
        # Extract from actual dataset structure
        repo_text = example.get('repo_text', '')
        question_with_choices = example.get('question', '')
        correct_answer = example.get('correct_letter', 'A')
        
        # The question field contains both question and choices
        # Extract them properly
        if 'Question:' in question_with_choices:
            parts = question_with_choices.split('Question:')
            if len(parts) > 1:
                question_part = parts[1].strip()
                # Split by choices (A), B), C), D))
                lines = question_part.split('\n')
                question = lines[0].strip()
                
                # Extract choices
                choice_lines = []
                for line in lines[1:]:
                    if line.strip() and any(line.strip().startswith(f'{letter})') for letter in ['A', 'B', 'C', 'D']):
                        choice_lines.append(line.strip())
                
                choice_text = '\n'.join(choice_lines) if choice_lines else question_with_choices
            else:
                question = question_with_choices
                choice_text = ""
        else:
            question = question_with_choices
            choice_text = ""
        
        # Create prompt following the paper's format
        prompt = f"""You are a coding expert. Your task is to analyze a GitHub repository and then answer one question about it.

Repository:
{repo_text}

Question:
{question}

{choice_text}

Please analyze the repository text, reason through the question, and then choose among A, B, C, D answers the correct one.

IMPORTANT: You must end your response with exactly this format:
Final Answer: <LETTER>

Where <LETTER> is A, B, C, or D."""
        
        # Get accurate token count for this prompt
        actual_tokens = self.count_tokens(prompt)
        print(f"Running LongCodeQA example ({actual_tokens:,} input tokens)")
        
        start_time = time.time()
        response, token_usage = self.invoke_claude_sonnet4(prompt, max_tokens=10000)  # Set high to avoid truncation
        end_time = time.time()
        
        # Extract answer
        predicted_answer = self._extract_answer_from_response(response)
        is_correct = predicted_answer.upper() == correct_answer.upper()
        
        result = {
            'task_type': 'LongCodeQA',
            'question': question,
            'correct_answer': correct_answer,
            'predicted_answer': predicted_answer,
            'is_correct': is_correct,
            'response': response,
            'response_time': end_time - start_time,
            'token_usage': token_usage,
            'timestamp': datetime.now().isoformat()
        }
        
        input_tokens = token_usage.get('inputTokens', 0)
        print(f"  Answer: {predicted_answer} ({'✓' if is_correct else '✗'}) - {end_time - start_time:.1f}s - {input_tokens:,} input tokens")
        
        return result
    
    
    def _extract_answer_from_response(self, response: str) -> str:
        """Extract the final answer letter from the response."""
        # Look for "Final Answer: X" pattern
        pattern = r"Final Answer:\s*([A-D])"
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Look for "The answer is X" pattern
        pattern2 = r"(?:The answer is|answer is)\s*([A-D])"
        match2 = re.search(pattern2, response, re.IGNORECASE)
        if match2:
            return match2.group(1)
        
        # Look for standalone letter at the end
        lines = response.strip().split('\n')
        for line in reversed(lines[-3:]):  # Check last 3 lines
            line = line.strip().upper()
            if line in ['A', 'B', 'C', 'D']:
                return line
            # Check if line ends with a letter
            if len(line) >= 1 and line[-1] in ['A', 'B', 'C', 'D']:
                return line[-1]
        
        # Last resort: look for any A, B, C, D in the last paragraph
        words = response.split()
        for word in reversed(words[-20:]):  # Check last 20 words
            clean_word = word.strip('.,!?()').upper()
            if clean_word in ['A', 'B', 'C', 'D']:
                return clean_word
        
        return "UNKNOWN"
    
    
    def run_context_length_evaluation(self, task_type: str, context_bin: int, max_examples: Optional[int] = None) -> List[Dict]:
        """Run evaluation for a specific task type and context length."""
        if task_type != 'LongCodeQA':
            raise ValueError(f"Only LongCodeQA task is supported, got: {task_type}")
            
        if context_bin not in self.qa_data:
            bin_name = self.bin_names.get(context_bin, f"{context_bin:,}")
            print(f"No LongCodeQA examples found for {bin_name} tokens")
            return []
        
        examples = self.qa_data[context_bin]
        
        if max_examples:
            examples = examples[:max_examples]
        
        bin_name = self.bin_names.get(context_bin, f"{context_bin:,}")
        print(f"\nRunning {len(examples)} {task_type} examples for {bin_name} tokens")
        print("=" * 60)
        
        results = []
        for i, example in enumerate(examples):
            print(f"Example {i+1}/{len(examples)}: ", end="")
            
            try:
                result = self.run_longcodeqa_example(example)
                
                result['context_bin'] = context_bin
                result['example_index'] = i
                results.append(result)
                
                # Save intermediate results
                self._save_intermediate_results(results, task_type, context_bin)
                
            except Exception as e:
                print(f"Error in example {i+1}: {e}")
                continue
        
        return results
    
    def run_full_evaluation(self, task_type: str, max_examples_per_bin: Optional[int] = None) -> Dict:
        """Run full LongCodeQA evaluation across all context lengths."""
        if task_type != 'LongCodeQA':
            raise ValueError(f"Only LongCodeQA task is supported, got: {task_type}")
            
        print(f"Starting LongCodeQA evaluation")
        print("Context bins:", [f"{b:,}" for b in self.context_bins])
        print(f"Max examples per bin: {max_examples_per_bin if max_examples_per_bin else 'All'}")
        print("=" * 70)
        
        start_time = datetime.now()
        all_results = {}
        
        for context_bin in self.context_bins:
            if context_bin in self.qa_data:
                results = self.run_context_length_evaluation(
                    task_type=task_type,
                    context_bin=context_bin,
                    max_examples=max_examples_per_bin
                )
                
                if results:
                    all_results[context_bin] = results
                    
                    # Calculate accuracy for this bin
                    correct_count = sum(1 for r in results if r['is_correct'])
                    accuracy = correct_count / len(results) if results else 0
                    bin_name = self.bin_names.get(context_bin, f"{context_bin:,}")
                    print(f"\nBin {bin_name} results: {correct_count}/{len(results)} correct ({accuracy:.1%})")
                    
                    # Token statistics
                    total_input_tokens = sum(r.get('token_usage', {}).get('inputTokens', 0) for r in results)
                    avg_input_tokens = total_input_tokens / len(results)
                    print(f"Average input tokens: {avg_input_tokens:,.0f}")
                    print("-" * 40)
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        # Create comprehensive results summary
        evaluation_results = {
            'metadata': {
                'task_type': task_type,
                'model': 'Claude Sonnet 4 (claude-sonnet-4-20250514-v1:0)',
                'benchmark': 'LongCodeBench',
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': duration.total_seconds(),
                'total_examples_tested': sum(len(results) for results in all_results.values())
            },
            'results_by_bin': all_results,
            'summary_by_bin': {}
        }
        
        # Calculate summary statistics
        for context_bin, results in all_results.items():
            if results:
                if task_type == 'LongCodeQA':
                    correct_count = sum(1 for r in results if r['is_correct'])
                    accuracy = correct_count / len(results)
                    evaluation_results['summary_by_bin'][context_bin] = {
                        'accuracy': accuracy,
                        'correct_examples': correct_count,
                        'total_examples': len(results)
                    }
                else:  # LongSWE-Bench
                    valid_patches = sum(1 for r in results if r['patch_format_valid'])
                    patch_rate = valid_patches / len(results)
                    evaluation_results['summary_by_bin'][context_bin] = {
                        'patch_generation_rate': patch_rate,
                        'valid_patches': valid_patches,
                        'total_examples': len(results)
                    }
                
                # Token statistics
                total_input_tokens = sum(r.get('token_usage', {}).get('inputTokens', 0) for r in results)
                total_output_tokens = sum(r.get('token_usage', {}).get('outputTokens', 0) for r in results)
                avg_response_time = sum(r['response_time'] for r in results) / len(results)
                
                evaluation_results['summary_by_bin'][context_bin].update({
                    'avg_input_tokens': total_input_tokens / len(results),
                    'avg_output_tokens': total_output_tokens / len(results),
                    'total_input_tokens': total_input_tokens,
                    'total_output_tokens': total_output_tokens,
                    'avg_response_time': avg_response_time
                })
        
        # Save final results
        output_file = f'lcb_{task_type.lower().replace("-", "_")}_results.json'
        with open(output_file, 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        
        print(f"\n{task_type} evaluation completed! Results saved to {output_file}")
        print(f"Total examples tested: {evaluation_results['metadata']['total_examples_tested']}")
        print(f"Duration: {duration}")
        
        return evaluation_results
    
    def _save_intermediate_results(self, results: List[Dict], task_type: str, context_bin: int):
        """Save intermediate results to prevent data loss."""
        filename = f'intermediate_lcb_{task_type.lower().replace("-", "_")}_{context_bin}.json'
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
    


if __name__ == "__main__":
    # Initialize benchmark
    benchmark = LongCodeBench()
    
    # Run LongCodeQA evaluation
    print("\n" + "="*70)
    print("RUNNING LONGCODEQA EVALUATION")  
    print("="*70)
    qa_results = benchmark.run_full_evaluation('LongCodeQA', max_examples_per_bin=3)
    
    # Run LongSWE-Bench evaluation
    print("\n" + "="*70)
    print("RUNNING LONGSWE-BENCH EVALUATION")
    print("="*70)
    swe_results = benchmark.run_full_evaluation('LongSWE-Bench', max_examples_per_bin=3)
    
    # Generate comparison data
    print("\n" + "="*70)
    print("GENERATING COMPARISON DATA")
    print("="*70)
    comparison_df = benchmark.generate_comparison_data(qa_results, swe_results)
    
    print("\n🎉 LongCodeBench evaluation completed!")
    print("Files created:")
    print("  • lcb_longcodeqa_results.json")
    print("  • lcb_longswe_bench_results.json") 
    print("  • claude_sonnet4_lcb_comparison.csv")
    print("  • intermediate_lcb_*.json files")
