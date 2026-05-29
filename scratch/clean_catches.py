import re

filepath = r"c:\xampp\htdocs\Jujutsu2 - Copia\frontend\src\views\FichaView.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1-based indices of catch statements where err is unused
target_lines = [435, 493, 514, 541, 591, 603, 647, 659, 707, 719, 758, 768, 780, 798, 811, 823, 839, 1644, 1665, 1898, 2255]

count = 0
for idx in range(len(lines)):
    line_num = idx + 1
    # Check if this line is close to any of our target lines
    if any(abs(line_num - t) <= 5 for t in target_lines):
        # Check if line contains catch (err) or catch(err)
        if "catch (err)" in lines[idx] or "catch(err)" in lines[idx]:
            lines[idx] = lines[idx].replace("catch (err)", "catch").replace("catch(err)", "catch")
            count += 1

print(f"Replaced {count} catch blocks.")

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)
