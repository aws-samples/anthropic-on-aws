package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/types"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime/document"
)

func main() {
	// Parse command line arguments
	region := flag.String("region", "us-east-1", "AWS region")
	maxChars := flag.Int("max-chars", 300000, "Maximum characters to read from file")
	inputFile := flag.String("file", "book.txt", "Input file path")
	prompt := flag.String("prompt", "Summarize this text:", "Prompt to send to Claude")
	flag.Parse()

	// Read file content
	text, err := readFileWithLimit(*inputFile, *maxChars)
	if err != nil {
		log.Fatalf("Error reading file: %v", err)
	}

	fmt.Printf("Read %d characters from %s\n", len(text), *inputFile)

	// Configure AWS SDK
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(*region))
	if err != nil {
		log.Fatalf("Unable to load SDK config: %v", err)
	}

	// Create Bedrock client
	client := bedrockruntime.NewFromConfig(cfg)

	// Create the full prompt text
	fullPrompt := fmt.Sprintf("%s %s", *prompt, text)

	// Create the request
	regularInput := &bedrockruntime.ConverseStreamInput{
		ModelId: aws.String("us.anthropic.claude-3-7-sonnet-20250219-v1:0"), // Update this to your model ID
		Messages: []types.Message{
			{
				Role: types.ConversationRoleUser,
				Content: []types.ContentBlock{
					&types.ContentBlockMemberText{
						Value: fullPrompt,
					},
				},
			},
		},
		InferenceConfig: &types.InferenceConfiguration{
			MaxTokens: aws.Int32(128000),
		},
		AdditionalModelRequestFields: document.NewLazyDocument(map[string]interface{}{
			"anthropic_beta": []string{"output-128k-2025-02-19"},
			"reasoning_config": map[string]interface{}{
				"type":          "enabled",
				"budget_tokens": 1024,
			},
		}),
	}

	fmt.Println("Calling Claude model using ConverseStream (this will fail without AWS credentials)...")
	
	// Make the API call to ConverseStream
	output, err := client.ConverseStream(context.TODO(), regularInput)

	// Process the streaming response
	fmt.Println("\nStreaming response from Claude:")
	
	// Variables to collect the response
	var fullResponse strings.Builder
	
	// Process each event in the stream
	for event := range output.GetStream().Events() {
		switch v := event.(type) {
		case *types.ConverseStreamOutputMemberContentBlockDelta:
			// Handle content delta (incremental text)
			if textDelta, ok := v.Value.Delta.(*types.ContentBlockDeltaMemberText); ok {
				fmt.Print(textDelta.Value) // Print incrementally
				fullResponse.WriteString(textDelta.Value)
			}
		case *types.ConverseStreamOutputMemberMessageStop:
			// Message is complete
			if v.Value.StopReason != "" {
				fmt.Printf("\n\nResponse complete. Stop reason: %s\n", v.Value.StopReason)
			} else {
				fmt.Printf("\n\nResponse complete.\n")
			}
		}
	}

	// Check for any errors in the stream
	if err := output.GetStream().Err(); err != nil {
		log.Printf("Error in stream: %v", err)
	}

	fmt.Println("\n--- Full Response ---")
	fmt.Println(fullResponse.String())
}

// readFileWithLimit reads up to maxChars characters from the given file path
func readFileWithLimit(filePath string, maxChars int) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	reader := bufio.NewReader(file)
	buffer := make([]byte, maxChars)
	n, err := reader.Read(buffer)
	
	if err != nil && err != io.EOF {
		return "", err
	}

	return strings.TrimSpace(string(buffer[:n])), nil
}