import re

with open('src/pages/PatientDetails.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace .number and .alt_number
content = re.sub(r'\.number\b', '.contact', content)
content = re.sub(r'\.alt_number\b', '.altContact', content)

content = re.sub(r'\bnumber: ', 'contact: ', content)
content = re.sub(r'\balt_number: ', 'altContact: ', content)
content = re.sub(r'\bcontactNumber: ', 'contact: ', content)

# Add EDD and Receive Messages
new_details_ui = """
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    (metadata.is_active === true || metadata.is_active === "true") ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(metadata.is_active === true || metadata.is_active === "true") ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    (metadata.receive_msgs !== false && metadata.receive_msgs !== "false") ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {(metadata.receive_msgs !== false && metadata.receive_msgs !== "false") ? 'Receives Msgs' : 'No Msgs'}
                  </span>
                </div>
              </div>
              
              {hasPregnancy && metadata.expected_due_date && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Expected Due Date</p>
                  <p className="font-medium text-slate-800">{safeDate(metadata.expected_due_date) ? safeDate(metadata.expected_due_date).toLocaleDateString() : metadata.expected_due_date}</p>
                </div>
              )}
"""

content = re.sub(r'\s*<p className="text-sm text-slate-500 mb-1">Status</p>.*?Inactive\'\}\n\s*</span>\n\s*</div>\n\s*</div>', new_details_ui, content, flags=re.DOTALL)

with open('src/pages/PatientDetails.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
