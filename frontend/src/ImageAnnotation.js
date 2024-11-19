import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Dialog, DialogContent } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';

const ImageAnnotation = ({ image, annotations = [], elementAnnotations = [], onAddAnnotation }) => {
  const canvasRef = useRef(null);
  const modalCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imgElement, setImgElement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Track zoom level
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Function to adjust canvas size
  const adjustCanvasSize = useCallback((img, canvas, ctx) => {
    const container = canvas.parentElement;
    const aspectRatio = img.width / img.height;

    let canvasWidth = container.clientWidth;
    let canvasHeight = container.clientHeight;

    if (canvasWidth / aspectRatio <= canvasHeight) {
      canvasHeight = canvasWidth / aspectRatio;
    } else {
      canvasWidth = canvasHeight * aspectRatio;
    }

    // Avoid resizing if the dimensions are already the same
    if (canvasSize.width === canvasWidth && canvasSize.height === canvasHeight) return;

    setCanvasSize({ width: canvasWidth, height: canvasHeight });
    canvas.width = canvasWidth * zoomLevel; // Apply zoom
    canvas.height = canvasHeight * zoomLevel; // Apply zoom

    drawImage(ctx, img);
  }, [canvasSize, zoomLevel]);

  // Effect to load the image and set dimensions
  useEffect(() => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      setImgElement(img);
      setImageDimensions({ width: img.width, height: img.height });
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        adjustCanvasSize(img, canvas, ctx);
      }
    };
  }, [image, adjustCanvasSize]);

  // Separate effect to handle drawing annotations
  useEffect(() => {
    if (canvasRef.current && imgElement) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      drawAnnotations(ctx, imgElement, annotations, elementAnnotations);
    }
  }, [annotations, elementAnnotations, imgElement, zoomLevel]);

  // Function to draw the image
  const drawImage = (ctx, img) => {
    if (!ctx || !img) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, img.width * zoomLevel, img.height * zoomLevel); // Apply zoom
  };

  // Function to draw annotations on the canvas
  const drawAnnotations = (ctx, img, annotations, elementAnnotations) => {
    if (!ctx || !img) return;
    const appliedScale = zoomLevel; // Apply zoom level to the scale

    drawImage(ctx, img);

    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation, 'red', appliedScale);
    });

    elementAnnotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation, 'green', appliedScale);
    });

    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation, 'green', appliedScale);
    }
  };

  const drawAnnotation = (ctx, annotation, color, scale) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      annotation.x * imageDimensions.width * scale, // Apply zoom scale
      annotation.y * imageDimensions.height * scale, // Apply zoom scale
      annotation.width * imageDimensions.width * scale, // Apply zoom scale
      annotation.height * imageDimensions.height * scale // Apply zoom scale
    );
  };

  const handleMouseDown = (e, canvas, appliedScale) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setIsDrawing(true);

    setCurrentAnnotation({
      x: (e.clientX - rect.left) / (imageDimensions.width * appliedScale),
      y: (e.clientY - rect.top) / (imageDimensions.height * appliedScale),
      width: 0,
      height: 0,
    });
  };

  const handleMouseMove = (e, canvas, appliedScale) => {
    if (!isDrawing || !canvas) return;
    const rect = canvas.getBoundingClientRect();

    setCurrentAnnotation((prev) => ({
      ...prev,
      width: ((e.clientX - rect.left) / (imageDimensions.width * appliedScale)) - prev.x,
      height: ((e.clientY - rect.top) / (imageDimensions.height * appliedScale)) - prev.y,
    }));

    const ctx = canvas.getContext('2d');
    drawAnnotations(ctx, imgElement, annotations, elementAnnotations);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAnnotation && currentAnnotation.width !== 0 && currentAnnotation.height !== 0) {
      onAddAnnotation(currentAnnotation);
    }
    setCurrentAnnotation(null);
  };

  // Handle zoom in/out with the mouse wheel
  const handleZoom = useCallback((e) => {
    e.preventDefault(); // Prevent the default scroll behavior of the parent
    const delta = e.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out
    setZoomLevel((prevZoom) => Math.max(0.5, Math.min(prevZoom * delta, 5))); // Limit zoom range
  }, []);

  // Add a useEffect to attach the event listener with passive:false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleZoom, { passive: false }); // Attach wheel event listener with passive:false
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleZoom); // Clean up the event listener
      }
    };
  }, [handleZoom]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Box mt={2} position="relative">
      <Box mb={1} display="flex" justifyContent="center">
        <IconButton onClick={openModal}>
          <FullscreenIcon />
        </IconButton>
      </Box>
      <canvas
        ref={canvasRef}
        style={{ border: '5px solid black', display: 'block', maxWidth: '100%', maxHeight: '100%' }}
        onMouseDown={(e) => handleMouseDown(e, canvasRef.current, zoomLevel)}
        onMouseMove={(e) => handleMouseMove(e, canvasRef.current, zoomLevel)}
        onMouseUp={handleMouseUp}
      />
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'white',
            padding: 0,
            margin: 0,
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <DialogContent style={{ padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Box position="absolute" top={10} right={10} zIndex={1}>
            <IconButton onClick={closeModal} style={{ color: 'black' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box position="relative">
            <canvas
              ref={modalCanvasRef}
              style={{
                border: '5px solid black',
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              onMouseDown={(e) => handleMouseDown(e, modalCanvasRef.current, zoomLevel)}
              onMouseMove={(e) => handleMouseMove(e, modalCanvasRef.current, zoomLevel)}
              onMouseUp={handleMouseUp}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ImageAnnotation;
