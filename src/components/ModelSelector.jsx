import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { supportsVision } from '../utils/modelUtils';

const SelectContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Select = styled.select`
  width: 200px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.darkMode ? '#3a3a3a' : '#fff'};
  color: ${props => props.darkMode ? '#fff' : '#000'};
  font-size: 16px;
  cursor: pointer;
  outline: none;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.darkMode ? '#444' : '#f5f5f5'};
  }

  option {
    background: ${props => props.darkMode ? '#3a3a3a' : '#fff'};
    color: ${props => props.darkMode ? '#fff' : '#000'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  color: #ff4a4a;
  font-size: 14px;
`;

const VisionBadge = styled.span`
  background: ${props => props.darkMode ? '#2a4a3a' : '#e6f4ea'};
  color: ${props => props.darkMode ? '#4ade80' : '#137333'};
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-weight: 500;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ModelSelector = ({ selectedModel, onSelectModel, darkMode }) => {
  const [models, setModels] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch('http://localhost:11434/api/tags');
        
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }

        const data = await response.json();
        if (data.models && data.models.length > 0) {
          // Sort models so vision models appear at the top
          const sortedModels = [...data.models].sort((a, b) => {
            const aHasVision = supportsVision(a.name);
            const bHasVision = supportsVision(b.name);
            if (aHasVision && !bHasVision) return -1;
            if (!aHasVision && bHasVision) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setModels(sortedModels);
          
          // If no model is selected or the selected model isn't in the list,
          // try to select a vision model first, then fall back to the first available model
          if (!selectedModel || !sortedModels.some(model => model.name === selectedModel)) {
            const savedModel = localStorage.getItem('selectedModel');
            if (savedModel && sortedModels.some(model => model.name === savedModel)) {
              onSelectModel(savedModel);
            } else {
              const firstVisionModel = sortedModels.find(model => supportsVision(model.name));
              onSelectModel(firstVisionModel?.name || sortedModels[0].name);
            }
          }
        } else {
          setError('No models found. Try running: ollama pull llava');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setError('Error loading models. Is Ollama running?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [selectedModel, onSelectModel]);

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    onSelectModel(newModel);
    localStorage.setItem('selectedModel', newModel);
  };

  return (
    <SelectContainer>
      <Select 
        value={selectedModel || ''}
        onChange={handleModelChange}
        disabled={isLoading || error}
        darkMode={darkMode}
      >
        {isLoading ? (
          <option>Loading models...</option>
        ) : error ? (
          <option>Error loading models</option>
        ) : (
          models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
              {supportsVision(model.name) ? ' (Vision)' : ''}
            </option>
          ))
        )}
      </Select>
      {!isLoading && !error && selectedModel && supportsVision(selectedModel) && (
        <VisionBadge darkMode={darkMode}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Vision
        </VisionBadge>
      )}
      {error && <ErrorText>{error}</ErrorText>}
    </SelectContainer>
  );
};

export default ModelSelector;
