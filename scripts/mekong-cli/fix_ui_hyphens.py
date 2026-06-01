import os
import re

components_dir = "/Users/macbook/mekong-cli/packages/ui/src/components"

def fix_content(content):
    # Regex to match Word-[a-zA-Z0-9] and replace with Word[A-Z0-9]
    def replace_hyphen(match):
        char = match.group(1)
        return char.upper()
    
    # We replace any occurrences of e.g. Compliance-status with ComplianceStatus
    # Matches a hyphen followed by a letter or digit, where it is part of an identifier
    return re.sub(r'-([a-zA-Z0-9])', replace_hyphen, content)

# Find all tsx and ts files in components_dir recursively
files_fixed = 0
for root, dirs, files in os.walk(components_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if there are any hyphens in identifiers (e.g. Word-word)
            # A simple way to check is if we match the pattern
            if re.search(r'[a-zA-Z0-9]-([a-zA-Z0-9])', content):
                new_content = fix_content(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed: {file_path}")
                files_fixed += 1

print(f"Total files fixed: {files_fixed}")
