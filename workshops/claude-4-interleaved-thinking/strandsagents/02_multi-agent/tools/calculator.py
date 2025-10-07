# tools/calculator.py
import re
import operator
import math
from typing import Union, Dict, Callable, Optional
from strands import tool


# Define safe operations dictionary
OPERATORS: Dict[str, Callable] = {
    '+': operator.add,
    '-': operator.sub,
    '*': operator.mul,
    '/': operator.truediv,
    '**': operator.pow,
    '%': operator.mod,
}

# Define constants dictionary
CONSTANTS: Dict[str, float] = {
    'pi': math.pi,
    'e': math.e,
}

# Define basic math functions
FUNCTIONS: Dict[str, Callable] = {
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'sqrt': math.sqrt,
    'abs': abs,
    'log': math.log10,
    'ln': math.log,
    'round': round,
}


def tokenize(expression: str) -> list:
    """Convert expression string into tokens for parsing."""
    # Replace function calls with placeholders
    for func_name in FUNCTIONS:
        pattern = f'{func_name}\\s*\\(([^\\(\\)]*)\\)'
        matches = re.findall(pattern, expression)
        for i, match in enumerate(matches):
            placeholder = f"__FUNC_{func_name}_{i}__"
            expression = expression.replace(f"{func_name}({match})", placeholder)
    
    # Tokenize the expression
    tokens = []
    i = 0
    while i < len(expression):
        if expression[i].isdigit() or expression[i] == '.':
            # Extract number
            j = i
            while j < len(expression) and (expression[j].isdigit() or expression[j] == '.'):
                j += 1
            tokens.append(expression[i:j])
            i = j
        elif expression[i].isalpha():
            # Extract variable or constant
            j = i
            while j < len(expression) and expression[j].isalpha():
                j += 1
            tokens.append(expression[i:j])
            i = j
        elif expression[i:i+2] in ('**', '<=', '>=', '==', '!='):
            # Two-character operators
            tokens.append(expression[i:i+2])
            i += 2
        elif expression[i] in '+-*/()%':
            # Single-character operators
            tokens.append(expression[i])
            i += 1
        elif expression[i] == ' ':
            # Skip whitespace
            i += 1
        elif '__FUNC_' in expression[i:i+7]:
            # Function placeholder
            j = expression.find('__', i + 7)
            if j != -1:
                tokens.append(expression[i:j+2])
                i = j + 2
            else:
                i += 1
        else:
            # Skip unknown characters
            i += 1
    
    return tokens


def safe_eval(expression: str) -> Union[float, int]:
    """Safely evaluate a mathematical expression without using eval()."""
    # Handle empty expression
    if not expression.strip():
        raise ValueError("Empty expression")
    
    # Replace common math terminology
    expression = expression.replace("×", "*").replace("÷", "/").replace("^", "**")
    
    # Simple validation check
    if not re.match(r'^[0-9\s\+\-\*\/\(\)\.\,\%\^a-zA-Z\_]+$', expression):
        raise ValueError("Expression contains invalid characters")
    
    # Tokenize the expression
    tokens = tokenize(expression)
    
    # Simple parser for arithmetic
    def parse_expression(tokens):
        if not tokens:
            raise ValueError("Empty expression")
        
        result = parse_term(tokens)
        
        while tokens and tokens[0] in ('+', '-'):
            op = tokens.pop(0)
            right = parse_term(tokens)
            if op == '+':
                result = result + right
            else:
                result = result - right
                
        return result
    
    def parse_term(tokens):
        result = parse_factor(tokens)
        
        while tokens and tokens[0] in ('*', '/', '%'):
            op = tokens.pop(0)
            right = parse_factor(tokens)
            if op == '*':
                result = result * right
            elif op == '/':
                if right == 0:
                    raise ValueError("Division by zero")
                result = result / right
            elif op == '%':
                result = result % right
                
        return result
    
    def parse_factor(tokens):
        if not tokens:
            raise ValueError("Unexpected end of expression")
        
        token = tokens.pop(0)
        
        # Handle numbers
        if token.replace('.', '', 1).isdigit():
            return float(token)
        
        # Handle constants
        if token.lower() in CONSTANTS:
            return CONSTANTS[token.lower()]
        
        # Handle parentheses
        if token == '(':
            result = parse_expression(tokens)
            if not tokens or tokens.pop(0) != ')':
                raise ValueError("Mismatched parentheses")
            return result
        
        # Handle negation
        if token == '-':
            return -parse_factor(tokens)
        
        # Handle function calls
        if token.startswith('__FUNC_'):
            parts = token.replace('__', '').split('_')
            func_name = parts[1]
            arg_str = expression.split(f"{func_name}(")[1].split(')')[0]
            
            # Recursively evaluate the function argument
            arg_value = safe_eval(arg_str)
            
            if func_name in FUNCTIONS:
                return FUNCTIONS[func_name](arg_value)
            else:
                raise ValueError(f"Unknown function: {func_name}")
        
        raise ValueError(f"Unexpected token: {token}")
    
    try:
        return parse_expression(tokens)
    except Exception as e:
        raise ValueError(f"Error evaluating expression: {str(e)}")


@tool
def calculator(expression: str) -> str:
    """Perform mathematical calculations safely.

    Evaluates mathematical expressions and formats the result appropriately.
    Handles basic operations and common mathematical notation.
    
    Args:
        expression: Mathematical expression to evaluate. Can include standard 
            operations (+, -, *, /) as well as common math notation (×, ÷, ^).
            Also supports basic functions like sin, cos, sqrt, etc.
    
    Returns:
        The result of the calculation as a string. Float results are 
        formatted to 2 decimal places.
    
    Raises:
        ValueError: When the expression cannot be evaluated due to syntax errors
            or invalid operations.
    
    Examples:
        >>> calculator("2 + 2")
        "4"
        >>> calculator("10 × 5")
        "50"
        >>> calculator("100 / 3")
        "33.33"
        >>> calculator("sqrt(16)")
        "4.00"
    """
    try:
        # Replace common math terminology with proper Python operators
        expression = expression.replace("×", "*").replace("÷", "/").replace("^", "**")

        # Use safe evaluation instead of eval()
        result = safe_eval(expression)

        # Format result based on type
        if isinstance(result, float):
            # Round to 2 decimal places for currency calculations
            formatted_result = f"{result:.2f}"
        else:
            formatted_result = str(result)

        return formatted_result
    except Exception as e:
        return f"Error calculating expression: {str(e)}"
