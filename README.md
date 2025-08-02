# MUD & TOTE Diagram Tool

An interactive web-based tool for creating Meaning-Use Diagrams (MUDs) and TOTE cycles based on Robert Brandom's philosophical framework.

## 🎯 Overview

This tool enables researchers and students to visually create and manipulate diagrams representing:
- **Meaning-Use Diagrams (MUDs)**: Relationships between vocabularies and practices
- **TOTE Cycles**: Test-Operate-Test-Exit feedback loops for goal-directed behavior

## ✨ Features

### Core Functionality
- **Interactive Canvas**: Drag-and-drop interface with zoom and pan
- **Node Types**: Vocabulary (ovals), Practice (rectangles), Test (diamonds), Operate (rectangles)
- **Edge Creation**: Click-to-connect with automatic semantic type detection
- **Label Editing**: Double-click any node to edit its label inline

### Export Capabilities
- **JSON**: Complete diagram data for sharing and backup
- **SVG**: Vector graphics for presentations and documents
- **LaTeX/TikZ**: Academic-quality output for scholarly publications

### Semantic Relationships
- **PV Relations**: Practice → Vocabulary (green arrows)
- **VP Relations**: Vocabulary → Practice (orange arrows)  
- **PP Relations**: Practice → Practice (purple arrows)
- **VV Relations**: Vocabulary → Vocabulary (red arrows)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Usage

1. **Create Nodes**: Select a tool (Vocabulary/Practice/Test/Operate) and click on canvas
2. **Move Nodes**: Use Select tool to drag nodes around
3. **Edit Labels**: Double-click any node to edit its text
4. **Create Connections**: Select Edge tool, click source node, then target node
5. **Export**: Use JSON, SVG, or LaTeX buttons to save your diagram

## 📚 Academic Integration

### LaTeX Export
The tool generates publication-ready TikZ code:

```latex
\documentclass[border=2mm]{standalone}
\usepackage{tikz}
\usetikzlibrary{positioning,shapes.geometric,arrows.meta}
% ... complete standalone document
```

### Philosophical Framework
Based on Robert Brandom's analysis of:
- **Meaning-Use Relations (MURs)**: The four basic relations between vocabularies and practices
- **TOTE Cycles**: Hierarchical goal-directed behavioral structures
- **Pragmatic Metavocabularies**: Higher-order relations between meaning and use

## 🛠 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: CSS with academic color schemes
- **Build**: Vite for fast development and optimized production builds
- **Export**: Native browser APIs for file downloads

## 📖 Documentation

See `CLAUDE.md` for:
- Development workflow
- Build commands
- Project structure
- Implementation notes

## 🤝 Contributing

This tool implements Robert Brandom's philosophical framework for academic research. Contributions should maintain conceptual accuracy and academic utility.

## 📄 License

Academic research tool - see license for usage terms.

## 🏛 Academic Context

This tool supports research in:
- Philosophy of Language
- Pragmatism and Inferentialism  
- Meaning and Use Studies
- Cognitive Architecture
- Goal-Directed Behavior Analysis