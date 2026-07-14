import re

with open('src/pages/Patients.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace .number and .alt_number
content = re.sub(r'\.number\b', '.contact', content)
content = re.sub(r'\.alt_number\b', '.altContact', content)

# Replace form keys
content = re.sub(r'number: ""', 'contact: ""', content)
content = re.sub(r'alt_number: ""', 'altContact: ""', content)
content = re.sub(r'form\.number', 'form.contact', content)
content = re.sub(r'form\.alt_number', 'form.altContact', content)
content = re.sub(r'errors\.number', 'errors.contact', content)
content = re.sub(r'errors\.alt_number', 'errors.altContact', content)
content = re.sub(r'e\.number =', 'e.contact =', content)
content = re.sub(r'e\.alt_number =', 'e.altContact =', content)
content = re.sub(r'set\("number"', 'set("contact"', content)
content = re.sub(r'set\("alt_number"', 'set("altContact"', content)
content = re.sub(r'number: md.contact', 'contact: md.contact', content) # Because of the .number replace above
content = re.sub(r'alt_number: md.altContact', 'altContact: md.altContact', content)

# Update Gender Label
gender_label_code = """
const genderLabel = (g) => {
  if (!g) return { label: "-", color: "bg-slate-100 text-slate-600" };
  const lower = g.toLowerCase();
  if (lower === "male") return { label: "M", color: "bg-blue-100 text-blue-700" };
  if (lower === "female") return { label: "F", color: "bg-pink-100 text-pink-700" };
  if (lower === "other") return { label: "O", color: "bg-green-100 text-green-700" };
  return { label: g.charAt(0).toUpperCase(), color: "bg-slate-100 text-slate-700" };
};
"""
content = re.sub(r'const genderLabel = \(g\) => \{.*?^\};', gender_label_code.strip(), content, flags=re.MULTILINE|re.DOTALL)

# Add 'O' to filter
content = re.sub(r'\{ label: "Male", value: "Male" \},\s*\{ label: "Female", value: "Female" \}', r'{ label: "Male", value: "Male" },\n    { label: "Female", value: "Female" },\n    { label: "Other", value: "Other" }', content)

# Replace "Contact Number" string if necessary
content = content.replace('"Contact Number"', '"Contact"')

with open('src/pages/Patients.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
