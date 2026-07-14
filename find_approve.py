with open("old_main.py", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()
    
for i, line in enumerate(lines):
    if "/approve" in line or "/reject" in line:
        print(f"--- MATCH AT LINE {i} ---")
        start = max(0, i-2)
        end = min(len(lines), i+30)
        for j in range(start, end):
            print(lines[j].rstrip())
        break
