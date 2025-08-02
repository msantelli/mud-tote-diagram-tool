# MUD & TOTE Diagram Tool

A web-based graphical tool for creating Meaning-Use Diagrams (MUDs) and TOTE Cycles based on Robert Brandom's philosophical framework.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── components/
│   └── Canvas/          # Main drawing canvas with D3.js integration
├── hooks/
│   ├── useD3.ts         # D3.js React integration hook
│   └── useDiagram.ts    # Diagram state management hook
├── store/
│   ├── diagramSlice.ts  # Redux slice for diagram data
│   ├── uiSlice.ts       # Redux slice for UI state
│   ├── store.ts         # Redux store configuration
│   └── hooks.ts         # Typed Redux hooks
├── types/
│   ├── diagram.ts       # Core diagram types
│   ├── nodes.ts         # Node type definitions
│   ├── edges.ts         # Edge type definitions
│   └── index.ts         # Type exports
└── App.tsx              # Main application component
```

## Features Implemented

✅ **Core Infrastructure**
- React 18 + TypeScript setup with Vite
- Redux Toolkit for state management
- D3.js integration for SVG rendering

✅ **Canvas & Interaction**
- Interactive SVG canvas with zoom and pan
- Click-to-create node functionality
- Drag-and-drop node positioning
- Real-time edge connections

✅ **Node Types**
- **Vocabulary Nodes**: Oval shapes for linguistic/conceptual systems
- **Practice Nodes**: Rounded rectangles for abilities/behaviors
- **Test Nodes**: Diamond shapes for TOTE cycle conditions
- **Operate Nodes**: Rectangles for TOTE cycle actions

✅ **Edge Types**
- **PV Relations**: Practice → Vocabulary (green)
- **VP Relations**: Vocabulary → Practice (orange)
- **PP Relations**: Practice → Practice (purple)
- **VV Relations**: Vocabulary → Vocabulary (red)
- **Resultant Relations**: Dotted lines for derived relationships

✅ **UI Features**
- Toolbar with tool selection (Select, Vocabulary, Practice, Test, Operate)
- Visual feedback for selected items
- Welcome screen for new users

## How to Use

1. **Create a Diagram**: Click "Create New Diagram" to start
2. **Add Nodes**: Select a node type from the toolbar, then click on the canvas
3. **Move Nodes**: Use the Select tool to drag nodes around
4. **Select Items**: Click on nodes or edges to select them (blue highlight)
5. **Navigate**: Use mouse wheel to zoom, drag to pan the canvas

## Node Types Explained

### MUD (Meaning-Use Diagram) Nodes
- **Vocabulary** (Oval): Represents linguistic or conceptual vocabularies
- **Practice** (Rounded Rectangle): Represents abilities, skills, or behavioral patterns

### TOTE (Test-Operate-Test-Exit) Nodes
- **Test** (Diamond): Represents condition checking or decision points
- **Operate** (Rectangle): Represents actions or operations to be performed

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run type-check       # TypeScript type checking
npm run lint             # ESLint code checking

# Build & Test
npm run build           # Production build
npm run preview         # Preview production build
npm test               # Run unit tests (Vitest)

# Dependencies
npm install            # Install all dependencies
npm install <package>  # Add new dependency
```

## Architecture Notes

### State Management
- **Redux Toolkit** with two main slices:
  - `diagramSlice`: Manages diagram data (nodes, edges, metadata)
  - `uiSlice`: Manages UI state (selected tool, zoom, pan, etc.)

### Component Architecture
- **Canvas**: Main D3.js-powered SVG canvas component
- **Hooks**: Custom hooks for D3 integration and diagram operations
- **Types**: Comprehensive TypeScript definitions for all data structures

### D3.js Integration
- Uses `useD3` hook to integrate D3.js with React lifecycle
- SVG rendering with proper enter/update/exit patterns
- Interactive behaviors (drag, zoom, pan) handled by D3

## Future Enhancements

🔲 **Property Panel**: Edit node labels, styles, and metadata
🔲 **Export Features**: Save diagrams as JSON, SVG, or LaTeX
🔲 **Auto-layout**: Automatic diagram layout algorithms
🔲 **Edge Creation**: Click-and-drag to create connections between nodes
🔲 **Undo/Redo**: History management for diagram changes
🔲 **Keyboard Shortcuts**: Power-user features

## Technical Stack

- **Frontend**: React 18, TypeScript, D3.js v7
- **State**: Redux Toolkit, React-Redux
- **Build**: Vite, ESLint, TypeScript
- **Testing**: Vitest, React Testing Library
- **Styling**: CSS with CSS Variables

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

Modern browsers with ES2020+ support required for D3.js features.

## Contributing

This tool implements Robert Brandom's philosophical framework for:
- **Meaning-Use Relations (MURs)**: The four basic relations between vocabularies and practices
- **TOTE Cycles**: Test-Operate-Test-Exit feedback loops for goal-directed behavior
- **Pragmatic Metavocabularies**: Higher-order vocabularies that describe the relations between base vocabularies and practices

The implementation follows the detailed specification in `/mud-tote-tool-spec.md`.

## General guidelines
Do not guess when using formal logic, philosophy or linguistic concepts. Ask first. This is a project made by and for experts in those areas. Do not introduce noise, do not guess, do not extend, do not decide on these issues. This is mostly relevant for documentation, comments and general aim of the project. You can include here validated vocabulary already approved by me.

- The gh cl tool is installed, feel free to use it.

## Collaboration 

 - Provide critical technical feedback, not affirmation
 - When the user proposes something, identify potential problems and simpler alternatives
 - Push back on complexity - default to "do we really need this?"
 - Skip social pleasantries and excesive enthusiasm in technical discussions
 - If something seems over-engineered, say so directly. 
 - Challenge assumptions and ask "what problems does this actually solve?"
 - Prefer "No, because..." over "Yes, and..." in design discussions
 - Avoid phrases like "Brilliant insight!" or "Absolutely correct!" unless genuinely warranted
 - Focus on technical merit and practical implications rather than validation
 - Remember to suggest to update our documentation regularly
 - Generate branches in the repository when new features are being discussed and implemented
 - Delete auxiliary files that are no longer needed after solving an issue


## Core Components
- **Generator**: Creates reasoning minimal pairs (config_argument_generator.py)
- **Evaluation**: Tests language models on generated benchmarks (evaluation/)
- **GUI Editor**: Visual rule creation tool (gui-editor/)

## Current Branch: development
## Current Status: Research prototype with capitalization system improvements and bug fixes implemented

## Session Workflow
1. Check `/research/current-tasks.md` for active tasks
2. Complete work and update task status  
3. End session by updating current-tasks.md with next priorities

## Quick Commands
```bash
# Generate dataset (basic)
python3 hf_dataset_converter.py data/sentences_english_2.jsonl 100

# Generate with formal validation
python3 hf_dataset_converter.py data/sentences_english_2.jsonl 100 --formal-validation

# Run evaluation 
cd evaluation && python3 evaluate.py --type huggingface --models gpt2

# Launch GUI editor
cd gui-editor && npm run electron:dev

# Test small dataset generation
python3 hf_dataset_converter.py data/sentences_english_2.jsonl 5
```

## Tool References
- **Large codebase analysis**: `gemini -p "@./ [question]"`
- **File inclusion**: `gemini -p "@src/ @tests/ [question]"`
- **Implementation verification**: `gemini -p "@src/ Has feature X been implemented?"`

## Project Focus
This is a research prototype for generating reasoning benchmarks. Avoid feature creep - focus on core functionality improvements, quality enhancements, and research utility rather than adding new capabilities unless specifically requested.

## Project Information
- **Repository**: https://github.com/msantelli/m_peirce
- **Authors**: Mauro Santelli, Joaquín Toranzo Calderón, Ramiro Caso, Nicolás Aguirre and Ramiro Rodriguez Colmeiro
- **Contact**: mesantelli@uba.ar
- **Version**: 3.1.0

## Recent Improvements (2025-07-07)

### Capitalization System
- **Clean Variable Control**: Templates now support both `{Variable}` (capitalized) and `{variable}` (lowercase) variants
- **Consistent Pattern Definitions**: All conditional patterns in language definitions are now consistently lowercase
- **Natural Template Flow**: Fixed "Therefore If" patterns to "Therefore, if" through template design
- **Simplified Generator Logic**: Removed complex post-processing, generator only handles first-letter capitalization and entity preservation

### Bug Fixes
- **JSON Object Insertion**: Fixed critical bug where raw JSON objects appeared in generated text instead of sentence content
- **Entity Preservation**: Proper nouns like names are correctly maintained during template processing
- **File Duplication**: Removed duplicate evaluation code that caused maintenance issues

### Repository Cleanup
- **GUI Editor Structure**: Created proper `config/rules/custom/` directory for YAML rule outputs
- **Code Deduplication**: Eliminated redundant files and clarified output purposes
- **Documentation Updates**: Current tasks and session guides now reflect actual system state

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

## When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

## Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results