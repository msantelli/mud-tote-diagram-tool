# MUD & TOTE Diagram Tool

An advanced web-based tool for creating and analyzing **Meaning-Use Diagrams (MUDs)** and **TOTE Cycles** based on Robert Brandom's philosophical framework. This tool provides researchers, philosophers, and students with a sophisticated platform for visualizing complex semantic relationships and goal-directed behavioral structures.

## 🎯 Overview

This interactive diagramming tool implements Robert Brandom's theoretical framework for analyzing the relationships between vocabularies and practices, supporting both:

- **Meaning-Use Diagrams (MUDs)**: Visual representations of semantic relationships between linguistic vocabularies and practical abilities
- **TOTE Cycles**: Test-Operate-Test-Exit behavioral loops for modeling goal-directed actions
- **Hybrid Diagrams**: Combined representations integrating both frameworks

## ✨ Key Features

### 🧠 **Advanced MUD Relations**
- **Qualified Edge Types**: Support for sufficiency and necessity qualifiers
  - `PV-suff/PV-nec`: Practice → Vocabulary (Sufficient/Necessary)
  - `VP-suff/VP-nec`: Vocabulary → Practice (Sufficient/Necessary)  
  - `PP-suff/PP-nec`: Practice → Practice (Sufficient/Necessary)
  - `VV-suff/VV-nec`: Vocabulary → Vocabulary (Sufficient/Necessary)
- **Auto-Detection Mode**: Intelligent edge type inference based on node connections
- **Manual Mode**: Precise control over semantic relationship specification
- **Resultant Relationships**: Toggle any edge as resultant/derived (dotted lines)
- **Directional Arrows**: Clear visual indication of relationship direction

### 🔄 **Complete TOTE Support**
- **Test Nodes**: Diamond-shaped decision/condition points
- **Operate Nodes**: Rectangular action/operation elements
- **Entry Arrows**: Parentless arrows indicating cycle initiation points
- **Exit Arrows**: Childless arrows showing successful completion paths
- **Flow Relations**: Sequence, feedback, loop, and exit connections

### 🎨 **Visual Customization**
- **Node Styling**: Size variants (small/medium/large), custom colors, and text color customization
- **Text Appearance**: Default black text with full color picker for customization
- **Arrow Precision**: Accurate arrowhead positioning for all node types and edge combinations
- **Smart Visual Coding**: 
  - Sufficient relations: Solid lines with standard colors
  - Necessary relations: Solid lines with darker colors
  - Resultant relations: Dotted lines with lighter colors
  - Node type differentiation: Vocabulary (ovals), Practice (rectangles), Test (diamonds), Operate (rectangles)

### 📊 **Academic Export Options**
- **JSON**: Complete diagram data with metadata
- **SVG**: Vector graphics for presentations and publications
- **LaTeX/TikZ**: Publication-ready academic diagrams
- **Custom Styling**: All exports respect visual customizations

### ⚙️ **Interactive Editing**
- **Click-to-Select**: Nodes and edges with visual feedback
- **Real-time Modification**: Change edge types, node properties, and styling
- **Keyboard Shortcuts**: Delete/Backspace for quick removal
- **Multi-modal Interface**: Tools adapt to current diagram mode

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone https://github.com/msantelli/mud-tote-diagram-tool.git
cd mud-tote-diagram-tool

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Basic Usage

1. **Choose Diagram Mode**: Select MUD, TOTE, or HYBRID from the mode toggle
2. **Create Nodes**: Select node type from toolbar and click on canvas
3. **Connect Elements**: Use Edge tool to create relationships between nodes
4. **Customize**: Select nodes/edges and use customization panels
5. **Export**: Save diagrams in JSON, SVG, or LaTeX formats

## 📚 Academic Context

### Philosophical Foundation

This tool implements key concepts from Robert Brandom's **Making It Explicit** and related works:

- **Meaning-Use Relations (MURs)**: The four fundamental relationships between linguistic vocabularies and practical abilities
- **Pragmatic Metavocabularies**: Higher-order vocabularies that articulate the relations between base vocabularies and practices
- **Inferential Semantics**: The role of inferential relationships in determining meaning
- **Social Practices**: The communal dimension of linguistic and practical abilities

### TOTE Cycle Theory

Based on Miller, Galanter, and Pribram's **Plans and the Structure of Behavior**:

- **Test Phase**: Condition evaluation and decision points
- **Operate Phase**: Action execution and environmental manipulation  
- **Exit Conditions**: Successful goal achievement indicators
- **Hierarchical Structure**: Nested cycles for complex behaviors

## 🎮 Usage Guide

### Creating MUD Diagrams

1. **Set Mode**: Select "MUD" from the mode toggle
2. **Auto-Detection**: 
   - Enable checkbox for automatic edge type inference
   - Connect Practice→Vocabulary for PV relations
   - Connect Vocabulary→Practice for VP relations
3. **Manual Mode**:
   - Disable auto-detection for qualified relations
   - Choose from 8 qualified edge types (4 base × 2 qualifiers)
   - Specify sufficiency/necessity semantics precisely

### Building TOTE Cycles

1. **Set Mode**: Select "TOTE" or "HYBRID"
2. **Create Flow Structure**:
   - Add Test nodes (diamonds) for conditions
   - Add Operate nodes (rectangles) for actions
   - Use Entry tool for cycle initiation points
   - Use Exit tool for completion paths
3. **Connect Elements**: Use Edge tool with sequence, feedback, loop, or exit relations

### Customization Options

#### Node Customization
- **Select Node**: Click with Select tool
- **Open Panel**: Click "🎨 Customize Node"
- **Modify Properties**:
  - Size: Small (0.8×), Medium (1×), Large (1.3×)
  - Background Color: Full color picker
  - Border Color: Custom border styling
  - Text Color: Full color picker (defaults to black)
- **Reset**: Return to default styling

#### Edge Modification
- **Select Edge**: Click edge line or label
- **Open Panel**: Click "⚙️ Modify Edge"
- **Change Type**: Choose from available qualified relations
- **Resultant Toggle**: Toggle any relationship as resultant (dotted lines)
  - Direct relationships: Solid lines
  - Resultant/derived relationships: Dotted lines with lighter colors
- **Delete**: Remove unwanted connections

### Keyboard Shortcuts

- **Delete/Backspace**: Remove selected nodes or edges
- **Escape**: Cancel current operation
- **Double-click**: Edit node labels inline

## 🔧 Technical Specifications

### Architecture
- **Frontend**: React 18 + TypeScript
- **Styling**: CSS with academic color schemes  
- **Build System**: Vite for development and production
- **State Management**: React hooks with local state
- **Rendering**: SVG with dynamic coordinate calculation

### Browser Support
- **Chrome/Edge**: 90+
- **Firefox**: 90+
- **Safari**: 14+

Modern browsers with ES2020+ support required.

### Export Formats

#### JSON Structure
```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "vocabulary|practice|test|operate",
      "position": {"x": 100, "y": 100},
      "label": "Node Label",
      "style": {
        "size": "medium",
        "backgroundColor": "#E3F2FD",
        "borderColor": "#1976D2",
        "textColor": "#000000"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "PV-suff|VP-nec|sequence|feedback|...",
      "isResultant": false
    }
  ],
  "metadata": {
    "created": "ISO-timestamp",
    "version": "1.0",
    "type": "MUD-TOTE"
  }
}
```

#### LaTeX/TikZ Output
- **Standalone Documents**: Complete LaTeX files with TikZ diagrams
- **Academic Quality**: Publication-ready styling and positioning
- **Custom Colors**: Maintains visual customizations in export
- **Scalable**: Vector-based output for any document size

## 🤝 Contributing

### Academic Guidelines
This tool maintains strict adherence to philosophical accuracy. When contributing:

- **Theoretical Fidelity**: Ensure changes align with Brandom's framework
- **Semantic Precision**: Maintain accurate relationship semantics
- **Academic Standards**: Support scholarly research requirements
- **Documentation**: Update both code and theoretical documentation

### Development Setup
```bash
# Development workflow
npm run dev              # Start dev server
npm run type-check       # TypeScript validation
npm run build           # Production build
npm run preview         # Test production build

# Code quality
npm run lint            # ESLint checking
npx tsc --noEmit       # Type checking
```

## 📖 Research Applications

### Philosophical Analysis
- **Semantic Theory**: Visualizing meaning-use relationships
- **Pragmatist Philosophy**: Analyzing practice-vocabulary connections
- **Inferential Semantics**: Mapping conceptual dependencies
- **Social Epistemology**: Understanding communal knowledge practices

### Cognitive Science
- **Behavioral Modeling**: TOTE cycle representations
- **Goal-Directed Action**: Hierarchical planning structures
- **Decision Processes**: Test-operate feedback loops
- **Skill Acquisition**: Practice-vocabulary development

### Educational Use
- **Philosophy Courses**: Visual aids for complex theoretical concepts
- **Research Methods**: Diagram creation for academic presentations
- **Collaborative Analysis**: Shared diagram development and discussion
- **Publication Support**: Export formats for academic papers

## 📄 Citation

When using this tool in academic work, please cite:

```
MUD & TOTE Diagram Tool (2024). Interactive visualization platform for 
Meaning-Use Diagrams and TOTE Cycles based on Robert Brandom's philosophical 
framework. https://github.com/msantelli/mud-tote-diagram-tool
```

## 📞 Support

For academic inquiries, technical support, or theoretical questions:

- **Repository**: [GitHub Issues](https://github.com/msantelli/mud-tote-diagram-tool/issues)
- **Academic Contact**: [Contact information for academic collaboration]
- **Documentation**: Comprehensive guides in `/docs` directory

## 🏛 Acknowledgments

This tool implements theoretical frameworks developed by:

- **Robert Brandom**: Meaning-Use Relations and Pragmatic Semantics
- **Miller, Galanter & Pribram**: TOTE Cycle Theory
- **Philosophical Community**: Ongoing research in inferential semantics and pragmatism

---

*Built for the academic community to advance research in philosophy of language, pragmatism, and cognitive science.*