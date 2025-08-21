# ABOUTME: Runner script for LongCodeQA evaluation of Claude Sonnet 4
# ABOUTME: Orchestrates LongCodeQA comprehension task across context lengths

import sys
import argparse
from longcodebench import LongCodeBench

def main():
    parser = argparse.ArgumentParser(description='Run LongCodeBench evaluation for Claude Sonnet 4')
    parser.add_argument('--task', choices=['longcodeqa'], 
                       default='longcodeqa', help='Task to run (only LongCodeQA supported)')
    parser.add_argument('--max-examples', type=int, default=None,
                       help='Maximum examples per context bin (default: all)')
    parser.add_argument('--config', default='config_lcb.json',
                       help='Configuration file')
    parser.add_argument('--context-bin', type=int, default=None,
                       help='Run only specific context bin (e.g., 32000, 64000, etc.)')
    
    args = parser.parse_args()
    
    print("Claude Sonnet 4 - LongCodeQA Evaluation")
    print("=" * 50)
    print("Testing long-context code comprehension across 32K to 1M tokens")
    print("Task: LongCodeQA (multiple-choice questions about large codebases)")
    print()
    
    print(f"Configuration: {args.config}")
    print(f"Task: {args.task}")
    print(f"Max examples per bin: {args.max_examples if args.max_examples else 'All'}")
    if args.context_bin:
        print(f"Context bin: {args.context_bin:,} tokens")
    print()
    
    try:
        # Initialize benchmark
        benchmark = LongCodeBench(args.config)
        
        qa_results = None
        
        if args.context_bin:
            # Run specific context bin only
            print(f"\n{'='*70}")
            print(f"RUNNING LONGCODEQA FOR {args.context_bin:,} TOKENS")
            print(f"{'='*70}")
            qa_bin_results = benchmark.run_context_length_evaluation(
                'LongCodeQA', args.context_bin, args.max_examples)
            print(f"Completed {len(qa_bin_results)} LongCodeQA examples")
            return
        
        # Run full evaluation
        print(f"\n{'='*70}")
        print("RUNNING LONGCODEQA EVALUATION")
        print(f"{'='*70}")
        # Use max_examples from config if not specified via command line
        max_examples = args.max_examples if args.max_examples is not None else benchmark.config['longcodebench'].get('max_examples_per_bin')
        qa_results = benchmark.run_full_evaluation('LongCodeQA', max_examples)
        
        # Print results summary
        if qa_results:
            print(f"\n🎉 LONGCODEQA EVALUATION COMPLETED!")
            print(f"{'='*50}")
            print(f"Results saved to lcb_longcodeqa_results.json")
            
            # Print summary results by context bin
            print(f"\nClaude Sonnet 4 LongCodeQA Performance Summary:")
            print(f"-" * 50)
            
            for context_bin in sorted(qa_results.get('summary_by_bin', {}).keys()):
                summary = qa_results['summary_by_bin'][context_bin]
                accuracy = summary['accuracy'] * 100  # Convert to percentage
                correct_count = summary['correct_examples']
                total_examples = summary['total_examples']
                bin_name = benchmark.bin_names.get(context_bin, f"{context_bin:,}")
                print(f"{bin_name:>10} tokens: {accuracy:5.1f}% ({correct_count}/{total_examples} correct)")
            
            print(f"\nFiles created:")
            print(f"  • lcb_longcodeqa_results.json - Detailed QA results")
            print(f"  • intermediate_lcb_*.json - Intermediate results")
            
            print(f"\nTo compare against Claude 3.5 Sonnet baseline:")
            print(f"Compare these results with the paper's Table 2 (LongCodeQA)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("Please check your configuration and try again.")
        return False

if __name__ == "__main__":
    import pandas as pd
    success = main()
    sys.exit(0 if success else 1)
