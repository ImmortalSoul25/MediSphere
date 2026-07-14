import re

with open('src/pages/Patients.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the gender label issue
gender_label_func = """
function genderLabel(gender) {
  if (!gender) return { label: "-", color: "bg-slate-100 text-slate-600" };
  const lower = gender.toLowerCase();
  if (lower === "male") return { label: "M", color: "bg-blue-100 text-blue-700" };
  if (lower === "female") return { label: "F", color: "bg-pink-100 text-pink-700" };
  if (lower === "other") return { label: "O", color: "bg-emerald-100 text-emerald-700" };
  return { label: gender.charAt(0).toUpperCase(), color: "bg-slate-100 text-slate-700" };
}
"""
content = re.sub(r'function genderLabel\(gender\) \{.*?\n\}', gender_label_func.strip(), content, flags=re.DOTALL)

# Update JSX usages
content = content.replace('{genderLabel(md.gender)}', '<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${genderLabel(md.gender).color}`}>{genderLabel(md.gender).label}</span>')
content = content.replace('{genderLabel(p.gender)}', '<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${genderLabel(p.gender).color}`}>{genderLabel(p.gender).label}</span>')

# Fix form keys properly (if it got mangled)
# It seems my previous script might have left number: md.number instead of contact: md.contact in the set() mapping.
# I will check if form.number or md.number exists
content = re.sub(r'\bmd\.number\b', 'md.contact', content)
content = re.sub(r'\bmd\.alt_number\b', 'md.altContact', content)
content = re.sub(r'\bform\.number\b', 'form.contact', content)
content = re.sub(r'\bform\.alt_number\b', 'form.altContact', content)

with open('src/pages/Patients.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
