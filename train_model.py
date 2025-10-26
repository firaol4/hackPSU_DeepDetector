import os
import pandas as pd
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import matplotlib.pyplot as plt

print('TensorFlow version:', tf.__version__)

# --- Paths ---
dataset_path = './split_dataset/'
train_path = os.path.join(dataset_path, 'train')
val_path = os.path.join(dataset_path, 'val')
test_path = os.path.join(dataset_path, 'test')

# --- Data Generators ---
input_size = 128
batch_size_num = 32

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)
test_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    directory=train_path,
    target_size=(input_size, input_size),
    class_mode='binary',
    batch_size=batch_size_num,
    shuffle=True
)

val_generator = test_datagen.flow_from_directory(
    directory=val_path,
    target_size=(input_size, input_size),
    class_mode='binary',
    batch_size=batch_size_num,
    shuffle=True
)

test_generator = test_datagen.flow_from_directory(
    directory=test_path,
    target_size=(input_size, input_size),
    classes=['real', 'fake'],
    class_mode=None,
    batch_size=1,
    shuffle=False
)

# --- Model ---
efficient_net = EfficientNetB0(
    weights='imagenet',
    input_shape=(input_size, input_size, 3),
    include_top=False,
    pooling='max'
)

model = Sequential([
    efficient_net,
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(128, activation='relu'),
    Dense(1, activation='sigmoid')
])

# Fine-tune top layers only
efficient_net.trainable = True
for layer in efficient_net.layers[:-20]:
    layer.trainable = False

model.compile(optimizer=Adam(1e-5), loss='binary_crossentropy', metrics=['accuracy'])
model.summary()

# --- Callbacks ---
checkpoint_dir = './tmp_checkpoint'
os.makedirs(checkpoint_dir, exist_ok=True)

callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
    ReduceLROnPlateau(factor=0.2, patience=2, verbose=1),
    ModelCheckpoint(
        filepath=os.path.join(checkpoint_dir, 'best_model.keras'),
        save_best_only=True,
        monitor='val_loss',
        mode='min',
        verbose=1
    )
]

# --- Train Model ---
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=20,
    callbacks=callbacks
)

# --- Plot Results ---
acc = history.history['accuracy']
val_acc = history.history['val_accuracy']
loss = history.history['loss']
val_loss = history.history['val_loss']

epochs = range(1, len(acc) + 1)
plt.plot(epochs, acc, 'bo', label='Training Accuracy')
plt.plot(epochs, val_acc, 'b', label='Validation Accuracy')
plt.title('Training and Validation Accuracy')
plt.legend()
plt.figure()

plt.plot(epochs, loss, 'ro', label='Training Loss')
plt.plot(epochs, val_loss, 'r', label='Validation Loss')
plt.title('Training and Validation Loss')
plt.legend()
plt.show()

# --- Evaluate on Test Data ---
best_model = load_model(os.path.join(checkpoint_dir, 'best_model.keras'))
test_generator.reset()

preds = best_model.predict(test_generator, verbose=1)
test_results = pd.DataFrame({
    "Filename": test_generator.filenames,
    "Prediction": preds.flatten()
})
print(test_results)

# --- Save Final Model ---
os.makedirs("model", exist_ok=True)
best_model.save("model/best_model.keras")
print("✅ Model saved to model/best_model.keras")
