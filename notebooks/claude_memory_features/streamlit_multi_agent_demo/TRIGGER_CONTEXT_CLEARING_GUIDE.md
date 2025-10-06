# Game Plan: How to Trigger Context Clearing in Streamlit Demo

## 🎯 Goal
Demonstrate context management clearing old tool results while preserving memory files.

---

## 📋 Quick Setup (5 minutes to first clear)

### Step 1: Configure for Fast Triggering
1. Open the Streamlit app: http://localhost:8501
2. Expand **⚙️ Context Management Settings**
3. Adjust settings:
   - **Trigger Threshold:** Set to **2,000 tokens** (drag slider left)
   - **Keep Last N Tool Uses:** Keep at **0** (clears everything old)
   - **Clear At Least:** Set to **500 tokens**

### Step 2: Clear Existing Memory Files
1. Expand **📁 Memory Files**
2. Click **Clear All** to start fresh
3. This ensures we're working with new data

### Step 3: Create Multiple Chats
1. Click **➕ Add New Chat** to create 2-3 chat windows
2. This lets you accumulate context faster across multiple conversations

---

## 🚀 Execution Strategy: "Memory Bombing"

### Method A: Rapid Memory Creation (Fastest - ~10 messages)

Send these messages in sequence across your chats:

#### Chat 1:
```
My name is Alice and I work at TechCorp. I'm interested in cloud migration services.
```
*Claude will create memory_alice.md*

```
Update my memory: I have a budget of $500K and need to migrate 50 applications by Q2 2025.
```
*Claude will update memory_alice.md*

```
Add to my memory: Our tech stack includes Java, Python, and PostgreSQL databases.
```
*Another update*

```
Remember: We have compliance requirements for HIPAA and SOC2.
```
*Another update*

```
Update: Our team size is 15 developers and we prefer AWS over other clouds.
```
*Another update*

#### Chat 2:
```
I'm Bob from Finance Inc. We need help with data analytics.
```
*Claude creates memory_bob.md*

```
Add to memory: We have 5TB of historical data in Oracle databases.
```
*Updates memory_bob.md*

```
Remember: Our fiscal year ends in June and we need this done by May.
```
*Another update*

```
Update memory: Budget approved is $300K, can extend to $400K if needed.
```
*Another update*

#### Chat 3:
```
This is Carol from HealthTech. We're looking at AI solutions.
```
*Claude creates memory_carol.md*

```
Update: We process 10,000 patient records daily and need HIPAA compliance.
```
*Updates memory*

```
Add to memory: Current system is on-premise, considering cloud migration.
```
*Another update*

---

### Method B: Detailed Information Gathering (Slower but more realistic - ~15 messages)

#### Chat 1 - Discovery Agent:
```
I represent a mid-size e-commerce company. We're experiencing performance issues during peak traffic. Can you help me document our requirements?
```

*Wait for response, then:*
```
Update my information: We have 2 million active users, 100K daily transactions, current infrastructure is on AWS EC2 with MySQL databases.
```

*Continue adding details:*
```
Add to memory: Peak traffic during holidays causes 30% of transactions to fail. Current response time is 3 seconds, we need it under 1 second.
```

```
Remember: Tech stack is React frontend, Node.js backend, MySQL database. We have a team of 8 engineers.
```

```
Update: Budget range is $200K-$400K. Timeline is critical - need implementation by Q1 2025.
```

#### Chat 2 - Solution Architect:
```
Based on the customer requirements in memory, can you design a solution architecture?
```

*After response:*
```
Update memory with the proposed architecture: [Copy key points from Claude's response]
```

```
Add to memory: Customer expressed concerns about database migration downtime. They can accept 4-hour maintenance window.
```

#### Chat 3 - Proposal Writer:
```
Create a proposal based on customer requirements and solution architecture from memory.
```

*After response:*
```
Save key proposal points to memory for future reference.
```

---

### Method C: "View All Memories" Spam (Most Token-Heavy per Operation)

This exploits the fact that viewing memories returns full content:

```
Show me all memories stored in the system.
```
*Claude will call memory tool with view command*

```
What memories do you have about me?
```
*Another view operation*

```
Read all memory files and summarize them.
```
*Another view operation*

```
Check memories and tell me what you know.
```
*Another view operation*

Repeat 10-15 times. Each `view` operation on `/memories` returns the full content of all files!

---

## 🔍 How to Verify It's Working

### Watch for These Indicators:

1. **Configuration Display** (appears at start of each Claude response):
   ```
   ⚙️ CM Config - Trigger: 2,000 tokens | Keep: 0 tools | Clear≥: 500 tokens
   ```

2. **Token Counts** (appears during each response):
   ```
   📊 Input: 1,847 tokens | Output: 156 tokens | ⏳ No clearing yet
   ```
   Watch the input tokens climb!

3. **The Big Moment** - When input tokens exceed 2,000:
   ```
   🎉 Context Management Active! Cleared 8 old tool use(s) and saved 1,234 tokens.
   ```

4. **Statistics Update**:
   - Expand **📊 Context Management Statistics**
   - Should now show:
     - Times Cleared: 1 (or more)
     - Tokens Saved: 1,234+
     - Last Cleared: [timestamp]

### Debug Mode:
During responses, you'll see an expandable section:
```
🔍 CM Data
```
Click to see the raw context management response from the API.

---

## 📊 Token Math (Understanding the Numbers)

### Typical Memory Operation Token Costs:
- **Create memory file:** 150-300 tokens (includes tool use + result)
- **Update memory file:** 200-400 tokens (includes reading old content)
- **View all memories:** 300-600 tokens (returns all file contents)
- **Delete memory:** 100-150 tokens

### To Reach 2,000 Token Threshold:
- **Minimum:** 7-8 memory operations (if all are views)
- **Typical:** 10-15 memory operations (mix of creates/updates)
- **With chat text:** Add 50-100 tokens per message for your questions

### Example Timeline:
```
Message 1: Create Alice memory     → Input tokens: 250
Message 2: Update Alice memory     → Input tokens: 550
Message 3: Create Bob memory       → Input tokens: 850
Message 4: Update Bob memory       → Input tokens: 1,200
Message 5: Create Carol memory     → Input tokens: 1,500
Message 6: Update Carol memory     → Input tokens: 1,850
Message 7: View all memories       → Input tokens: 2,350 ✂️ CLEAR!
```

---

## 🎮 Fastest Path (Under 3 Minutes)

### Ultra-Fast Strategy:
1. **Set trigger to 2,000 tokens**
2. **Paste this into Chat 1:**
   ```
   I'm Alice from TechCorp with $500K budget for cloud migration of 50 apps using Java and Python with PostgreSQL databases, need HIPAA and SOC2 compliance, 15 developers, prefer AWS, deadline Q2 2025.
   ```

3. **Paste this into Chat 2:**
   ```
   I'm Bob from Finance Inc with 5TB data in Oracle databases, need analytics solution, budget $300K-$400K, fiscal year ends June, need completion by May, urgency high.
   ```

4. **Paste this into Chat 3:**
   ```
   I'm Carol from HealthTech processing 10K patient records daily, need HIPAA compliance, current on-premise system, considering cloud migration, need AI solutions for medical data analysis.
   ```

5. **Back to Chat 1:**
   ```
   Show me all memories in the system.
   ```

6. **Chat 2:**
   ```
   What do you remember about all users?
   ```

7. **Chat 3:**
   ```
   List all memory files and their contents.
   ```

8. **Chat 1:**
   ```
   Read all memories again and summarize.
   ```

9. **Chat 2:**
   ```
   Check memory files once more.
   ```

**Boom! Should trigger clearing by message 8-10.**

---

## 🐛 Troubleshooting

### "No clearing yet" persists after 20+ messages:

**Check these:**
1. Is Context Management enabled? (checkbox should be checked)
2. What's your trigger threshold? (should be 2,000 for fast demo)
3. Are you actually using memory tools? (look for 🔧 Memory Tool cards in responses)
4. Check input tokens in each response - are they accumulating?

### Input tokens not increasing:
- Make sure Claude is actually calling memory tools
- If Claude just responds without tools, prompt explicitly:
  ```
  Please save this information to memory: [your info]
  ```

### Clearing happened but no stats:
- This was the bug we just fixed!
- Refresh the page to load the new code
- Try again

---

## 📈 Production-Ready Settings

Once you've verified it works with 2K threshold:

### For Real Demos:
- **Trigger:** 5,000-10,000 tokens (more realistic)
- **Keep:** 1-2 (preserve recent context)
- **Clear At Least:** 1,000 tokens

### For Production:
- **Trigger:** 20,000-50,000 tokens (documentation recommended)
- **Keep:** 3-5 (balance context vs. efficiency)
- **Clear At Least:** 2,000 tokens

---

## 🎯 Success Criteria

You've successfully demonstrated context management when:

✅ You see the success banner: "🎉 Context Management Active!"
✅ Statistics show non-zero "Times Cleared" and "Tokens Saved"
✅ Memory files persist even after clearing
✅ Conversation continues smoothly after clearing
✅ Subsequent clears work automatically as tokens accumulate

---

## 💡 Pro Tips

1. **Multi-Chat is Key:** Using 3 chats simultaneously accumulates tokens faster
2. **Memory Views are Heavy:** `view /memories` operations return lots of tokens
3. **Updates > Creates:** Memory updates include old content, so more tokens
4. **Long User Messages:** Your prompts add to input tokens too
5. **Watch the Numbers:** Keep an eye on "Input: X tokens" - that's your progress bar!

---

## 🎬 Demo Script (For Presentations)

```
"Let me show you Claude's context management in action.

[Open Settings]
I've configured a 2,000 token trigger - lower than production but great for demos.

[Chat 1]
I'll create a customer profile...
'I'm Alice from TechCorp with a $500K cloud migration project.'

[Watch for memory tool use]
See that? Claude created a memory file. That's about 250 tokens.

[Chat 2]
Now another customer...
'I'm Bob from Finance Inc needing data analytics.'

[Continue across chats]
As we accumulate more memories, watch the input tokens climb...

[After several exchanges]
There! 🎉 Context Management activated!

[Show Statistics]
It cleared 8 old tool results and saved over 1,200 tokens,
but notice - all our memory files are still intact!"
```

---

**Ready to trigger some context clearing? Start with Method A for fastest results!** 🚀
