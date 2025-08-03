import { useState, useEffect } from 'react';

export interface StoredDiagram {
  id: string;
  name: string;
  data: any; // The diagram data (nodes, edges, etc.)
  lastModified: number;
  mode: 'MUD' | 'TOTE' | 'HYBRID';
}

export const useOfflineStorage = () => {
  const [diagrams, setDiagrams] = useState<StoredDiagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const STORAGE_KEY = 'mud-tote-diagrams';

  // Load diagrams from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedDiagrams = JSON.parse(storedData);
        setDiagrams(Array.isArray(parsedDiagrams) ? parsedDiagrams : []);
      }
    } catch (error) {
      console.warn('Failed to load stored diagrams:', error);
      setDiagrams([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save diagrams to localStorage whenever diagrams change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
      } catch (error) {
        console.warn('Failed to save diagrams to storage:', error);
      }
    }
  }, [diagrams, isLoading]);

  const saveDiagram = (diagramData: Omit<StoredDiagram, 'id' | 'lastModified'>) => {
    const newDiagram: StoredDiagram = {
      ...diagramData,
      id: `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastModified: Date.now()
    };

    setDiagrams(prev => [newDiagram, ...prev]);
    return newDiagram.id;
  };

  const updateDiagram = (id: string, updates: Partial<Omit<StoredDiagram, 'id' | 'lastModified'>>) => {
    setDiagrams(prev => prev.map(diagram => 
      diagram.id === id 
        ? { ...diagram, ...updates, lastModified: Date.now() }
        : diagram
    ));
  };

  const deleteDiagram = (id: string) => {
    setDiagrams(prev => prev.filter(diagram => diagram.id !== id));
  };

  const getDiagram = (id: string): StoredDiagram | undefined => {
    return diagrams.find(diagram => diagram.id === id);
  };

  const exportDiagrams = () => {
    const dataStr = JSON.stringify(diagrams, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mud-tote-diagrams-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importDiagrams = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (Array.isArray(importedData)) {
            const validDiagrams = importedData.filter(item => 
              item && typeof item === 'object' && 
              item.name && item.data && item.mode
            );
            
            // Add imported diagrams with new IDs to avoid conflicts
            const newDiagrams = validDiagrams.map(diagram => ({
              ...diagram,
              id: `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              lastModified: Date.now()
            }));
            
            setDiagrams(prev => [...newDiagrams, ...prev]);
            resolve(newDiagrams.length);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const clearAllDiagrams = () => {
    setDiagrams([]);
  };

  const getStorageInfo = () => {
    try {
      const used = new Blob([JSON.stringify(diagrams)]).size;
      const available = 5 * 1024 * 1024; // Assume 5MB localStorage limit
      
      return {
        used,
        available,
        percentage: Math.round((used / available) * 100),
        diagramCount: diagrams.length
      };
    } catch {
      return {
        used: 0,
        available: 0,
        percentage: 0,
        diagramCount: diagrams.length
      };
    }
  };

  return {
    diagrams,
    isLoading,
    saveDiagram,
    updateDiagram,
    deleteDiagram,
    getDiagram,
    exportDiagrams,
    importDiagrams,
    clearAllDiagrams,
    getStorageInfo
  };
};