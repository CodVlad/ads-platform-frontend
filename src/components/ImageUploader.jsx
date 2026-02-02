import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../hooks/useToast';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

const SortableImageItem = ({ file, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      queueMicrotask(() => setPreview(url));
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  if (!preview) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        width: '120px',
        height: '120px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '2px solid #ddd',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: '#f8f9fa',
      }}
    >
      <img
        src={preview}
        alt={`Preview ${index + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
        title="Remove image"
      >
        ×
      </button>
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'grab',
        }}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>
    </div>
  );
};

const ImageUploader = ({ value = [], onChange, maxFiles = 10, maxSize = MAX_FILE_SIZE }) => {
  const { error: showError } = useToast();
  const [files, setFiles] = useState(value);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setFiles(value);
  }, [value]);

  const validateFile = useCallback(
    (file) => {
      if (!file.type.startsWith('image/')) {
        showError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > maxSize) {
        showError(`${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        return false;
      }
      return true;
    },
    [maxSize, showError],
  );

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          showError(`${file.name} is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
        } else if (error.code === 'file-invalid-type') {
          showError(`${file.name} is not a valid image file`);
        } else {
          showError(`${file.name}: ${error.message}`);
        }
      });
    });

    // Validate accepted files
    const validFiles = acceptedFiles.filter(validateFile);

    // Check total file count
    const newTotal = files.length + validFiles.length;
    if (newTotal > maxFiles) {
      showError(`Maximum ${maxFiles} images allowed. You can add ${maxFiles - files.length} more.`);
      const remaining = maxFiles - files.length;
      validFiles.splice(remaining);
    }

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      onChange(newFiles);
    }
  }, [files, maxFiles, maxSize, onChange, showError, validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize,
    multiple: true,
    disabled: files.length >= maxFiles,
  });

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange(newFiles);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id;
      const newIndex = over.id;
      const newFiles = arrayMove(files, oldIndex, newIndex);
      setFiles(newFiles);
      onChange(newFiles);
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#007bff' : '#ddd'}`,
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: files.length >= maxFiles ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
          transition: 'all 0.2s',
          opacity: files.length >= maxFiles ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
        {files.length >= maxFiles ? (
          <p style={{ color: '#666', margin: 0 }}>
            Maximum {maxFiles} images reached
          </p>
        ) : isDragActive ? (
          <p style={{ color: '#007bff', margin: 0, fontWeight: '500' }}>
            Drop images here...
          </p>
        ) : (
          <>
            <p style={{ color: '#333', margin: '0 0 8px 0', fontWeight: '500' }}>
              Drag & drop images or click to select
            </p>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
              Up to {maxFiles} images, max {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
              Images: {files.length}/{maxFiles}
            </span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((_, index) => index)}
              strategy={rectSortingStrategy}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '16px',
              }}>
                {files.map((file, index) => (
                  <SortableImageItem
                    key={index}
                    file={file}
                    index={index}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

