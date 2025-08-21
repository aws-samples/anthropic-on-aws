# ABOUTME: NIAH (Needle in a Haystack) benchmark implementation for testing Claude Sonnet 4
# ABOUTME: Tests context retrieval accuracy by placing facts in long documents at various depths

import boto3
import json
import random
import re
import time
from typing import Dict, List, Tuple
from botocore.config import Config
from datetime import datetime

class NIAHBenchmark:
    def __init__(self):
        # Configure Bedrock client with timeout and retries
        config = Config(
            read_timeout=600, 
            retries=dict(max_attempts=25)
        )
        
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name="us-west-2"
        )
        
        # Needle templates - facts to hide in the haystack
        self.needle_templates = [
            "The magic number is {number}.",
            "The secret code is {code}.",
            "The hidden password is {password}.",
            "The special key is {key}.",
            "The unique identifier is {identifier}.",
        ]
        
        # Load base text from On the Origin of Species
        self.base_text = self._load_base_text()

    def _load_base_text(self) -> str:
        """Load the base text from on_the_origin_of_species.txt"""
        with open('on_the_origin_of_species.txt', 'r', encoding='utf-8') as f:
            return f.read().strip()

    def estimate_tokens(self, text: str) -> int:
        """Estimate tokens using word count ratio (219,883 tokens / 158,600 words ~ 1.3 tokens/word)"""
        word_count = len(text.split())
        return int(word_count * 1.3)

    def generate_needle(self) -> Tuple[str, str, str]:
        """Generate a random needle fact with question and answer."""
        template = random.choice(self.needle_templates)
        
        if "number" in template:
            value = str(random.randint(10000, 99999))
            needle = template.format(number=value)
            question = "What is the magic number mentioned in the text?"
            answer = value
        elif "code" in template:
            value = f"{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))}{random.randint(100, 999)}"
            needle = template.format(code=value)
            question = "What is the secret code mentioned in the text?"
            answer = value
        elif "password" in template:
            value = f"{''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=4))}{random.randint(1000, 9999)}"
            needle = template.format(password=value)
            question = "What is the hidden password mentioned in the text?"
            answer = value
        elif "key" in template:
            value = f"KEY-{''.join(random.choices('0123456789ABCDEF', k=6))}"
            needle = template.format(key=value)
            question = "What is the special key mentioned in the text?"
            answer = value
        else:  # identifier
            value = f"ID{''.join(random.choices('0123456789', k=8))}"
            needle = template.format(identifier=value)
            question = "What is the unique identifier mentioned in the text?"
            answer = value
            
        return needle, question, answer

    def create_haystack_text(self, target_tokens: int) -> str:
        """Create text of approximately target_tokens by repeating or trimming base text"""
        base_tokens = 219883  # Known token count for full text
        
        if target_tokens <= base_tokens:
            # Trim the base text for smaller targets
            target_words = target_tokens / 1.3  # tokens per word ratio
            words = self.base_text.split()
            trimmed_words = words[:int(target_words)]
            return " ".join(trimmed_words)
        else:
            # Repeat and trim for larger targets
            repetitions_needed = (target_tokens + base_tokens - 1) // base_tokens
            repeated_text = (self.base_text + "\n\n") * repetitions_needed
            
            target_words = target_tokens / 1.3
            words = repeated_text.split()
            if len(words) > target_words:
                trimmed_words = words[:int(target_words)]
                repeated_text = " ".join(trimmed_words)
            
            return repeated_text

    def create_haystack(self, target_tokens: int, needle: str, depth_percent: float) -> str:
        """Create a haystack of approximately target_tokens with needle at depth_percent"""
        # Create the full haystack text first
        full_text = self.create_haystack_text(target_tokens)
        words = full_text.split()
        
        # Calculate insertion point based on words (simpler than token counting)
        insertion_word_index = int(len(words) * depth_percent)
        
        # Insert needle at word boundary
        words_before = words[:insertion_word_index]
        words_after = words[insertion_word_index:]
        
        result = " ".join(words_before) + f" {needle} " + " ".join(words_after)
        return result

    def invoke_model(self, haystack: str, question: str) -> Tuple[str, Dict]:
        """Invoke Claude Sonnet 4 with the haystack and question."""
        prompt = f"<context>\n{haystack}\n</context>\n\n{question}\n\nPlease provide only the answer, without explanation."
        
        try:
            response = self.bedrock.converse(
                modelId="us.anthropic.claude-sonnet-4-20250514-v1:0",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                inferenceConfig={
                    "maxTokens": 100,
                    "temperature": 0.0,
                    "topP": 0.9
                },
                additionalModelRequestFields={
                    "anthropic_beta": ["context-1m-2025-08-07"]
                }
            )
            
            response_text = response['output']['message']['content'][0]['text']
            
            # Extract token usage information
            token_usage = response.get('usage', {})
            
            return response_text.strip(), token_usage
            
        except Exception as e:
            print(f"Error invoking model: {e}")
            return "", {}

    def evaluate_response(self, response: str, correct_answer: str) -> bool:
        """Evaluate if the response contains the correct answer."""
        return correct_answer.lower() in response.lower()

    def run_single_test(self, context_length: int, depth_percent: float) -> Dict:
        """Run a single NIAH test."""
        print(f"Testing context length {context_length:,} at depth {depth_percent:.1%}")
        
        # Generate needle and question
        needle, question, answer = self.generate_needle()
        
        # Create haystack
        haystack = self.create_haystack(context_length, needle, depth_percent)
        actual_length = len(haystack)
        estimated_tokens = self.estimate_tokens(haystack)
        
        # Invoke model
        start_time = time.time()
        response, token_usage = self.invoke_model(haystack, question)
        end_time = time.time()
        
        # Evaluate response
        is_correct = self.evaluate_response(response, answer)
        
        result = {
            'context_length': context_length,
            'actual_length': actual_length,
            'estimated_tokens': estimated_tokens,
            'depth_percent': depth_percent,
            'needle': needle,
            'question': question,
            'correct_answer': answer,
            'model_response': response,
            'is_correct': is_correct,
            'response_time': end_time - start_time,
            'timestamp': datetime.now().isoformat(),
            'token_usage': token_usage
        }
        
        input_tokens = token_usage.get('inputTokens', 0)
        output_tokens = token_usage.get('outputTokens', 0)
        print(f"  Result: {'✓' if is_correct else '✗'} ({response}) - {end_time - start_time:.1f}s - {estimated_tokens:,} estimated tokens, {input_tokens:,} real input tokens, {output_tokens:,} output tokens")
        return result

    def run_benchmark(self, num_trials: int = None) -> List[Dict]:
        """Run the complete NIAH benchmark."""
        if num_trials is None:
            num_trials = 2
            
        context_lengths = [10000, 100000, 500000, 999000]
        depth_percentages = [0.1, 0.25, 0.5, 0.75, 0.9]
        
        results = []
        total_tests = len(context_lengths) * len(depth_percentages) * num_trials
        test_count = 0
        
        print(f"Starting NIAH benchmark with {total_tests} total tests")
        print("=" * 60)
        
        for context_length in context_lengths:
            for depth_percent in depth_percentages:
                for trial in range(num_trials):
                    test_count += 1
                    print(f"Test {test_count}/{total_tests}")
                    
                    try:
                        result = self.run_single_test(context_length, depth_percent)
                        results.append(result)
                        
                        # Save intermediate results
                        with open('niah_results.json', 'w') as f:
                            json.dump(results, f, indent=2)
                            
                    except Exception as e:
                        print(f"  Error in test: {e}")
                        
                    print()
        
        print("NIAH benchmark completed!")
        return results

    def analyze_results(self, results: List[Dict]) -> Dict:
        """Analyze benchmark results."""
        # Calculate token statistics
        total_input_tokens = sum(r.get('token_usage', {}).get('inputTokens', 0) for r in results)
        total_output_tokens = sum(r.get('token_usage', {}).get('outputTokens', 0) for r in results)
        avg_input_tokens = total_input_tokens / len(results) if results else 0
        avg_output_tokens = total_output_tokens / len(results) if results else 0
        
        analysis = {
            'total_tests': len(results),
            'overall_accuracy': sum(r['is_correct'] for r in results) / len(results),
            'by_context_length': {},
            'by_depth': {},
            'avg_response_time': sum(r['response_time'] for r in results) / len(results),
            'token_stats': {
                'total_input_tokens': total_input_tokens,
                'total_output_tokens': total_output_tokens,
                'avg_input_tokens': avg_input_tokens,
                'avg_output_tokens': avg_output_tokens,
                'total_tokens': total_input_tokens + total_output_tokens
            }
        }
        
        # Analysis by context length
        context_lengths = [10000, 100000, 500000, 990000]
        for length in context_lengths:
            length_results = [r for r in results if r['context_length'] == length]
            if length_results:
                length_input_tokens = sum(r.get('token_usage', {}).get('inputTokens', 0) for r in length_results)
                length_output_tokens = sum(r.get('token_usage', {}).get('outputTokens', 0) for r in length_results)
                analysis['by_context_length'][length] = {
                    'accuracy': sum(r['is_correct'] for r in length_results) / len(length_results),
                    'avg_response_time': sum(r['response_time'] for r in length_results) / len(length_results),
                    'avg_input_tokens': length_input_tokens / len(length_results),
                    'avg_output_tokens': length_output_tokens / len(length_results),
                    'total_tokens': length_input_tokens + length_output_tokens,
                    'count': len(length_results)
                }
        
        # Analysis by depth
        depth_percentages = [0.1, 0.25, 0.5, 0.75, 0.9]
        for depth in depth_percentages:
            depth_results = [r for r in results if r['depth_percent'] == depth]
            if depth_results:
                analysis['by_depth'][depth] = {
                    'accuracy': sum(r['is_correct'] for r in depth_results) / len(depth_results),
                    'avg_response_time': sum(r['response_time'] for r in depth_results) / len(depth_results),
                    'count': len(depth_results)
                }
        
        return analysis

if __name__ == "__main__":
    benchmark = NIAHBenchmark()
    results = benchmark.run_benchmark()
    analysis = benchmark.analyze_results(results)
    
    # Save final results
    with open('niah_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    with open('niah_analysis.json', 'w') as f:
        json.dump(analysis, f, indent=2)
    
    print("Results saved to niah_results.json and niah_analysis.json")
