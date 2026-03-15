import Dexie from 'dexie';

export const db = new Dexie('60SecondsUGC');

db.version(1).stores({
  characters: 'id, name',
  items: 'id, name, category',
  backgrounds: 'id, name',
});

// Helper to convert File to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Helper to resize image before storing
export const resizeImage = (base64, maxWidth = 512, maxHeight = 512) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64;
  });
};
