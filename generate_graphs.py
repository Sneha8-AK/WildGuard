import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Create artifacts directory if it doesn't exist
artifact_dir = r"C:\Users\sneha\.gemini\antigravity\brain\a5342be2-8897-49f5-8c01-f5e291ef4b0c\artifacts"
os.makedirs(artifact_dir, exist_ok=True)

df = pd.read_csv(r"c:\Users\sneha\OneDrive\Documents\wildgaurd\public\forest_animal_movement_dataset.csv")

# 1. Animal Species Distribution
plt.figure(figsize=(10, 6))
sns.countplot(data=df, x='animal_type', palette='viridis', order=df['animal_type'].value_counts().index)
plt.title('Animal Species Distribution')
plt.ylabel('Count')
plt.xlabel('Animal Type')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(os.path.join(artifact_dir, 'species_distribution.png'))
plt.close()

# 2. Average Movement Speed by Species
plt.figure(figsize=(10, 6))
sns.barplot(data=df, x='animal_type', y='movement_speed_mps', palette='magma')
plt.title('Average Movement Speed by Species (m/s)')
plt.ylabel('Average Speed (m/s)')
plt.xlabel('Animal Type')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig(os.path.join(artifact_dir, 'speed_by_species.png'))
plt.close()

# 3. Animal Activity Distribution
plt.figure(figsize=(10, 6))
sns.countplot(data=df, y='activity', palette='Set2', order=df['activity'].value_counts().index)
plt.title('Animal Activity Distribution')
plt.xlabel('Count')
plt.ylabel('Activity')
plt.tight_layout()
plt.savefig(os.path.join(artifact_dir, 'activity_distribution.png'))
plt.close()

print("Graphs generated successfully.")
