import re

# Read the file
with open('components/BlueprintFactory.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all non-ASCII characters except standard symbols
# This will remove ALL corrupted emojis at once
content = re.sub(r'[^\x00-\x7F]+', '', content)

# Write back
with open('components/BlueprintFactory.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed all non-ASCII characters!")
