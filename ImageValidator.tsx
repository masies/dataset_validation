import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ChevronLeft, ChevronRight, Plus, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ImageValidator = () => {
  const [dataset, setDataset] = useState([
    {
      id: 1,
      imageUrl: "/api/placeholder/640/480",
      items: [
        {
          id: "1-1",
          bounding_boxes: [100, 80, 300, 120],
          tag: "button",
          validated: false,
          isValid: null
        },
        {
          id: "1-2",
          bounding_boxes: [150, 200, 350, 240],
          tag: "dropdown",
          validated: false,
          isValid: null
        }
      ]
    },
    {
      id: 2,
      imageUrl: "/api/placeholder/640/480",
      items: [
        {
          id: "2-1",
          bounding_boxes: [50, 150, 250, 190],
          tag: "textbox",
          validated: false,
          isValid: null
        }
      ]
    }
  ]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  const imageRef = useRef(null);
  const startPos = useRef(null);

  const handleValidation = (imageIndex, itemIndex, isValid) => {
    const updatedDataset = [...dataset];
    updatedDataset[imageIndex].items[itemIndex] = {
      ...updatedDataset[imageIndex].items[itemIndex],
      validated: true,
      isValid: isValid
    };
    setDataset(updatedDataset);
    setSelectedItem(null);
  };

  const handleMouseDown = (e) => {
    if (!drawMode) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startPos.current = { x, y };
    setIsDrawing(true);
    setNewBox({
      x,
      y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !drawMode) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNewBox({
      x: Math.min(x, startPos.current.x),
      y: Math.min(y, startPos.current.y),
      width: Math.abs(x - startPos.current.x),
      height: Math.abs(y - startPos.current.y)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawMode) return;
    
    setIsDrawing(false);
    if (newBox && newBox.width > 10 && newBox.height > 10) {
      setShowTagInput(true);
    } else {
      setNewBox(null);
    }
  };

  const addNewBox = () => {
    if (!newBox || !newTag) return;
    
    const updatedDataset = [...dataset];
    const newItem = {
      id: `${currentImageIndex}-${Date.now()}`,
      bounding_boxes: [
        newBox.x,
        newBox.y,
        newBox.x + newBox.width,
        newBox.y + newBox.height
      ],
      tag: newTag,
      validated: false,
      isValid: null
    };
    
    updatedDataset[currentImageIndex].items.push(newItem);
    setDataset(updatedDataset);
    setNewBox(null);
    setNewTag('');
    setShowTagInput(false);
    setDrawMode(false);
  };

  const isAllItemsValidated = (image) => {
    return image.items.every(item => item.validated);
  };

  const getProgressStats = () => {
    let totalItems = 0;
    let validatedItems = 0;
    let correctItems = 0;
    let incorrectItems = 0;

    dataset.forEach(image => {
      image.items.forEach(item => {
        totalItems++;
        if (item.validated) {
          validatedItems++;
          if (item.isValid) correctItems++;
          else incorrectItems++;
        }
      });
    });

    return { totalItems, validatedItems, correctItems, incorrectItems };
  };

  const stats = getProgressStats();
  const currentImage = dataset[currentImageIndex];

  const ValidationControls = ({ imageIndex, itemIndex, item, position }) => (
    <div 
      className="absolute z-10 flex gap-1 bg-white rounded-md shadow-sm border p-1"
      style={{
        left: `${position.x + position.width + 8}px`,
        top: `${position.y}px`
      }}
    >
      <button
        className="flex items-center justify-center h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded-md"
        onClick={(e) => {
          e.stopPropagation();
          handleValidation(imageIndex, itemIndex, true);
        }}
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        className="flex items-center justify-center h-8 w-8 bg-red-600 hover:bg-red-700 text-white rounded-md"
        onClick={(e) => {
          e.stopPropagation();
          handleValidation(imageIndex, itemIndex, false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Progress bar and controls */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress: {stats.validatedItems}/{stats.totalItems} items</span>
              <span>Correct: {stats.correctItems}</span>
              <span>Incorrect: {stats.incorrectItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(stats.validatedItems / stats.totalItems) * 100}%` }}
              />
            </div>
          </div>

          {/* Draw mode toggle */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setDrawMode(!drawMode)}
              variant={drawMode ? "default" : "outline"}
              className={`gap-2 ${drawMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              <Square className="h-4 w-4" />
              {drawMode ? 'Exit Draw Mode' : 'Draw New Box'}
            </Button>

            {drawMode && (
              <div className="text-sm text-gray-600">
                Click and drag to draw a new bounding box
              </div>
            )}
          </div>

          {/* Image number and navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Image
            </Button>
            <span className="text-lg font-semibold">
              Image {currentImageIndex + 1} of {dataset.length}
            </span>
            <Button
              onClick={() => setCurrentImageIndex(Math.min(dataset.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === dataset.length - 1 || !isAllItemsValidated(currentImage)}
              variant="outline"
            >
              Next Image
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Image container with bounding boxes */}
          <div 
            className="relative"
            style={{ cursor: drawMode ? 'crosshair' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                setIsDrawing(false);
                setNewBox(null);
              }
            }}
          >
            <img
              ref={imageRef}
              src={currentImage.imageUrl}
              alt="GUI element to validate"
              className="max-w-full h-auto"
            />
            
            {/* Existing boxes */}
            {currentImage.items.map((item, itemIndex) => {
              const [x1, y1, x2, y2] = item.bounding_boxes;
              const position = {
                x: x1,
                y: y1,
                width: x2 - x1,
                height: y2 - y1
              };

              const getBorderColor = () => {
                if (item.validated) {
                  return item.isValid ? 'border-green-500' : 'border-red-500';
                }
                return selectedItem === item.id ? 'border-yellow-500' : 'border-blue-500';
              };

              const getBackgroundColor = () => {
                if (item.validated) {
                  return item.isValid ? 'bg-green-100/30' : 'bg-red-100/30';
                }
                return selectedItem === item.id ? 'bg-yellow-100/30' : 'bg-transparent';
              };

              return (
                <div key={item.id}>
                  <div
                    className={`absolute border-2 cursor-pointer ${getBorderColor()} ${getBackgroundColor()}`}
                    style={{
                      left: position.x,
                      top: position.y,
                      width: position.width,
                      height: position.height,
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => !item.validated && !drawMode && setSelectedItem(item.id)}
                  >
                    <div className="absolute -top-6 left-0 bg-white px-2 py-0.5 text-sm rounded shadow-sm border">
                      {item.tag}
                    </div>
                  </div>
                  {selectedItem === item.id && !item.validated && (
                    <ValidationControls
                      imageIndex={currentImageIndex}
                      itemIndex={itemIndex}
                      item={item}
                      position={position}
                    />
                  )}
                </div>
              );
            })}

            {/* Drawing new box */}
            {newBox && (
              <div
                className="absolute border-2 border-dashed border-blue-500 bg-blue-100/20"
                style={{
                  left: newBox.x,
                  top: newBox.y,
                  width: newBox.width,
                  height: newBox.height
                }}
              />
            )}
          </div>

          {/* Tag input for new box */}
          {showTagInput && (
            <div className="flex gap-2 items-center">
              <Input
                type="text"
                placeholder="Enter tag for new box"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-grow"
              />
              <Button 
                onClick={addNewBox}
                disabled={!newTag}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Box
              </Button>
              <Button 
                onClick={() => {
                  setNewBox(null);
                  setNewTag('');
                  setShowTagInput(false);
                  setDrawMode(false);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}

          {!isAllItemsValidated(currentImage) && (
            <div className="text-center text-amber-600 font-medium">
              Please validate all items before proceeding to the next image
            </div>
          )}

          {/* Items list */}
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Items in this image:</h3>
            {currentImage.items.map((item) => (
              <div 
                key={item.id}
                className={`p-2 rounded ${
                  item.validated
                    ? item.isValid
                      ? 'bg-green-50'
                      : 'bg-red-50'
                    : 'bg-gray-50'
                }`}
              >
                <span className="font-medium">{item.tag}</span>
                {item.validated && (
                  <span className={`ml-2 text-sm ${
                    item.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.isValid ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageValidator;
