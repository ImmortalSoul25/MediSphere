import re

with open('whatsapp_bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logic for STOP/START
stop_start_logic = """
    if lower == "stop":
        from database import patients_collection, pregnancy_templates_collection
        patient = await patients_collection.find_one({"metadata.contact": phone})
        if patient:
            await patients_collection.update_one({"_id": patient["_id"]}, {"$set": {"metadata.receive_msgs": False}})
        stop_tmpl = await pregnancy_templates_collection.find_one({"week": "stop_msg"})
        msg = stop_tmpl["message"] if stop_tmpl else "Okay messages are stopped."
        return provider.send_message(phone, msg)
        
    if lower == "start":
        from database import patients_collection, pregnancy_templates_collection
        patient = await patients_collection.find_one({"metadata.contact": phone})
        if patient:
            await patients_collection.update_one({"_id": patient["_id"]}, {"$set": {"metadata.receive_msgs": True}})
        start_tmpl = await pregnancy_templates_collection.find_one({"week": "start_msg"})
        msg = start_tmpl["message"] if start_tmpl else "Welcome back! Messages resumed."
        return provider.send_message(phone, msg)
        
    if lower in VALID_GREETING:
"""
content = re.sub(r'    if lower in VALID_GREETING:', stop_start_logic.lstrip(), content, count=1)

with open('whatsapp_bot.py', 'w', encoding='utf-8') as f:
    f.write(content)
