import React, { useState, useRef } from 'react';
import { Card, Button, Input, Progress, message } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  LeftOutlined, 
  RightOutlined, 
  PlusOutlined, 
  BorderOutlined 
} from '@ant-design/icons';

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
          isValid: null,
        },
        {
          id: "1-2",
          bounding_boxes: [150, 200, 350, 240],
          tag: "dropdown",
          validated: false,
          isValid: null,
        },
      ],
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
          isValid: null,
        },
      ],
    },
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
      isValid,
    };
    setDataset(updatedDataset);
    setSelectedItem(null);
    message.success(isValid ? 'Marked as Correct' : 'Marked as Incorrect');
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
      height: 0,
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
      height: Math.abs(y - startPos.current.y),
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
        newBox.y + newBox.height,
      ],
      tag: newTag,
      validated: false,
      isValid: null,
    };

    updatedDataset[currentImageIndex].items.push(newItem);
    setDataset(updatedDataset);
    setNewBox(null);
    setNewTag('');
    setShowTagInput(false);
    setDrawMode(false);
  };

  const isAllItemsValidated = (image) => image.items.every((item) => item.validated);

  const getProgressStats = () => {
    let totalItems = 0;
    let validatedItems = 0;
    let correctItems = 0;
    let incorrectItems = 0;

    dataset.forEach((image) => {
      image.items.forEach((item) => {
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

  return (
    <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3>Progress</h3>
        <Progress 
          percent={(stats.validatedItems / stats.totalItems) * 100} 
          status="active" 
          showInfo={false} 
        />
        <p>
          Validated: {stats.validatedItems}/{stats.totalItems} | Correct: {stats.correctItems} | Incorrect: {stats.incorrectItems}
        </p>
      </div>

      <Button
        type={drawMode ? 'primary' : 'default'}
        onClick={() => setDrawMode(!drawMode)}
        icon={<BorderOutlined />}
        style={{ marginBottom: '16px' }}
      >
        {drawMode ? 'Exit Draw Mode' : 'Draw New Box'}
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Button 
          onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))} 
          disabled={currentImageIndex === 0} 
          icon={<LeftOutlined />}
        >
          Previous
        </Button>
        <span>Image {currentImageIndex + 1} of {dataset.length}</span>
        <Button 
          onClick={() => setCurrentImageIndex((prev) => Math.min(dataset.length - 1, prev + 1))} 
          disabled={currentImageIndex === dataset.length - 1 || !isAllItemsValidated(currentImage)} 
          icon={<RightOutlined />}
        >
          Next
        </Button>
      </div>

      <div
        style={{ position: 'relative', cursor: drawMode ? 'crosshair' : 'default' }}
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
          alt="Current"
          style={{ maxWidth: '100%' }}
        />
        {currentImage.items.map((item, index) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: item.bounding_boxes[0],
              top: item.bounding_boxes[1],
              width: item.bounding_boxes[2] - item.bounding_boxes[0],
              height: item.bounding_boxes[3] - item.bounding_boxes[1],
              border: '2px solid',
              borderColor: item.validated
                ? item.isValid
                  ? 'green'
                  : 'red'
                : 'blue',
            }}
          >
            <p style={{ background: 'white', padding: '2px', margin: 0 }}>{item.tag}</p>
            {!item.validated && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <Button 
                  size="small" 
                  type="primary" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleValidation(currentImageIndex, index, true)}
                />
                <Button 
                  size="small" 
                  type="danger" 
                  icon={<CloseOutlined />} 
                  onClick={() => handleValidation(currentImageIndex, index, false)}
                />
              </div>
            )}
          </div>
        ))}
        {newBox && (
          <div
            style={{
              position: 'absolute',
              left: newBox.x,
              top: newBox.y,
              width: newBox.width,
              height: newBox.height,
              border: '2px dashed blue',
              backgroundColor: 'rgba(0, 0, 255, 0.2)',
            }}
          />
        )}
      </div>

      {showTagInput && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Input 
            placeholder="Enter tag" 
            value={newTag} 
            onChange={(e) => setNewTag(e.target.value)} 
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addNewBox}
          >
            Add
          </Button>
          <Button onClick={() => {
            setNewBox(null);
            setNewTag('');
            setShowTagInput(false);
          }}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ImageValidator;
