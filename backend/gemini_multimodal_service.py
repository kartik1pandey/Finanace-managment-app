import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
import pandas as pd
import PyPDF2
import io
import chardet
from PIL import Image

load_dotenv()

class GeminiMultimodalService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY') or 'AIzaSyBaEvnN61Q7apJBRPc3P_4DZsw_or_1hDY'
        if not api_key:
            print("⚠️  GEMINI_API_KEY not found. Using fallback responses.")
            self.client = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel('gemini-2.0-flash')
                print("✅ Gemini multimodal client initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize Gemini: {e}")
                self.client = None
        
        # Store conversation history per session
        self.conversation_history = {}
    
    def process_csv_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process CSV files and extract financial data"""
        try:
            # Detect encoding
            detected = chardet.detect(file_content)
            encoding = detected.get('encoding', 'utf-8')
            
            # Read CSV
            df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
            
            # Get basic info
            total_rows = len(df)
            columns = list(df.columns)
            
            # Find financial columns
            financial_columns = []
            date_columns = []
            
            for col in columns:
                col_lower = col.lower()
                if any(word in col_lower for word in ['amount', 'balance', 'debit', 'credit', 'price', 'value', 'cost', 'payment', 'withdrawal', 'deposit']):
                    financial_columns.append(col)
                if any(word in col_lower for word in ['date', 'time', 'day', 'month', 'year']):
                    date_columns.append(col)
            
            # Calculate totals for financial columns
            totals = {}
            for col in financial_columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    totals[col] = float(df[col].sum())
            
            # Get preview data
            preview = df.head(10).to_dict('records')
            
            # Create summary text
            summary = f"""**File: {filename}**
- Type: CSV
- Total Rows: {total_rows}
- Columns: {', '.join(columns)}
- Financial Columns: {', '.join(financial_columns) if financial_columns else 'None detected'}
- Date Columns: {', '.join(date_columns) if date_columns else 'None detected'}

**Totals:**
{chr(10).join([f'- {col}: ₹{amount:,.2f}' for col, amount in totals.items()])}

**Data Preview (first 5 rows):**
{df.head(5).to_string()}"""
            
            return {
                "success": True,
                "filename": filename,
                "type": "CSV",
                "rows": total_rows,
                "columns": columns,
                "financial_columns": financial_columns,
                "date_columns": date_columns,
                "totals": totals,
                "preview": preview,
                "summary": summary,
                "full_data": df.to_dict('records') if total_rows < 1000 else preview,
                "raw_text": df.to_string()  # For context
            }
        except Exception as e:
            print(f"❌ CSV processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def process_excel_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process Excel files"""
        try:
            xl_file = pd.ExcelFile(io.BytesIO(file_content))
            sheets = xl_file.sheet_names
            all_data = {}
            summary_parts = [f"**File: {filename}**", f"- Type: Excel", f"- Sheets: {', '.join(sheets)}", ""]
            raw_text = ""
            
            for sheet in sheets:
                df = pd.read_excel(io.BytesIO(file_content), sheet_name=sheet)
                all_data[sheet] = {
                    "rows": len(df),
                    "columns": list(df.columns),
                    "preview": df.head(5).to_dict('records')
                }
                summary_parts.append(f"**Sheet: {sheet}**")
                summary_parts.append(f"- Rows: {len(df)}")
                summary_parts.append(f"- Columns: {', '.join(df.columns)}")
                summary_parts.append("")
                raw_text += f"\n\nSheet: {sheet}\n{df.head(10).to_string()}"
            
            return {
                "success": True,
                "filename": filename,
                "type": "Excel",
                "sheets": sheets,
                "data": all_data,
                "summary": "\n".join(summary_parts),
                "raw_text": raw_text
            }
        except Exception as e:
            print(f"❌ Excel processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def process_pdf_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process PDF files"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            num_pages = len(pdf_reader.pages)
            
            # Extract text from all pages (limit to first 10 for performance)
            text_content = ""
            for i in range(min(10, num_pages)):
                text_content += pdf_reader.pages[i].extract_text() + "\n\n"
            
            summary = f"""**File: {filename}**
- Type: PDF
- Pages: {num_pages}

**Extracted Text (first {min(10, num_pages)} pages):**
{text_content[:3000]}..."""
            
            return {
                "success": True,
                "filename": filename,
                "type": "PDF",
                "pages": num_pages,
                "text": text_content,
                "summary": summary,
                "raw_text": text_content
            }
        except Exception as e:
            print(f"❌ PDF processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def process_text_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process text files"""
        try:
            detected = chardet.detect(file_content)
            encoding = detected.get('encoding', 'utf-8')
            text = file_content.decode(encoding)
            
            summary = f"""**File: {filename}**
- Type: Text
- Length: {len(text)} characters

**Content Preview:**
{text[:2000]}..."""
            
            return {
                "success": True,
                "filename": filename,
                "type": "Text",
                "text": text,
                "summary": summary,
                "raw_text": text
            }
        except Exception as e:
            print(f"❌ Text processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "filename": filename
            }
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session"""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        return self.conversation_history[session_id]
    
    def add_to_history(self, session_id: str, role: str, content: str):
        """Add message to conversation history"""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        
        self.conversation_history[session_id].append({
            "role": role,
            "content": content
        })
        
        # Keep only last 20 messages to manage context size
        if len(self.conversation_history[session_id]) > 20:
            self.conversation_history[session_id] = self.conversation_history[session_id][-20:]
    
    def clear_history(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
    
    async def analyze_files_with_context(self,
                                        processed_files: List[Dict[str, Any]],
                                        user_message: str,
                                        session_id: Optional[str] = None,
                                        mcp_context: Optional[str] = None) -> Dict[str, Any]:
        """Analyze uploaded files using Gemini with financial context and conversation history"""
        if not self.client:
            # Fallback response
            file_summaries = "\n\n".join([f["summary"] for f in processed_files if "summary" in f])
            return {
                "response": f"I've processed your files:\n\n{file_summaries}\n\nI can see transaction data and financial information. What specific insights would you like?",
                "suggestions": [
                    "Calculate total spending",
                    "Identify spending categories",
                    "Find largest transactions",
                    "Compare with portfolio"
                ]
            }
        
        try:
            # Get conversation history
            history = []
            if session_id:
                history = self.get_conversation_history(session_id)
            
            # Combine all file summaries and raw data
            file_data_parts = []
            for f in processed_files:
                if f.get("success"):
                    file_data_parts.append(f"=== {f['filename']} ===")
                    file_data_parts.append(f.get("summary", ""))
                    if f.get("raw_text"):
                        file_data_parts.append("\nDetailed Data:")
                        file_data_parts.append(f["raw_text"][:5000])  # Limit to 5000 chars per file
            
            file_data = "\n\n".join(file_data_parts)
            
            # Build conversation context
            conversation_context = ""
            if history:
                conversation_context = "\n**PREVIOUS CONVERSATION:**\n"
                for msg in history[-6:]:  # Last 3 exchanges
                    role = "User" if msg["role"] == "user" else "Assistant"
                    conversation_context += f"{role}: {msg['content'][:200]}...\n"
                conversation_context += "\n"
            
            # Build comprehensive prompt
            prompt = f"""You are an expert financial advisor analyzing uploaded documents with conversation context.

{mcp_context if mcp_context else ''}

{conversation_context}

**UPLOADED FILES ANALYSIS:**
{file_data}

**USER'S CURRENT QUESTION:** "{user_message}"

**INSTRUCTIONS:**
1. Consider the previous conversation context when answering
2. Analyze the uploaded files in detail
3. Identify key financial insights (spending patterns, trends, anomalies)
4. Calculate relevant totals and statistics
5. Compare with the user's existing portfolio if MCP data is available
6. Provide actionable recommendations
7. Be specific with numbers from the actual data
8. Use Indian Rupee (₹) currency format
9. Reference previous conversation points if relevant

Provide a comprehensive analysis (250-400 words) with:
- Direct answer to the user's question
- Summary of findings from files
- Key insights
- Specific recommendations
- Next steps or follow-up suggestions"""
            
            # Call Gemini
            response = self.client.generate_content(prompt)
            ai_response = response.text
            
            # Add to conversation history
            if session_id:
                self.add_to_history(session_id, "user", user_message)
                self.add_to_history(session_id, "assistant", ai_response)
            
            # Generate contextual suggestions
            suggestions = []
            for file in processed_files:
                if file.get("financial_columns"):
                    suggestions.append(f"Analyze spending patterns in {file['filename']}")
                if file.get("type") == "CSV":
                    suggestions.append("Show category breakdown")
            
            # Add default suggestions
            default_suggestions = [
                "Show monthly trends",
                "Identify top expenses",
                "Compare with budget",
                "Investment recommendations"
            ]
            suggestions.extend(default_suggestions)
            
            return {
                "response": ai_response,
                "suggestions": suggestions[:4]
            }
        
        except Exception as e:
            print(f"❌ Gemini analysis error: {e}")
            import traceback
            traceback.print_exc()
            
            # Return processed data summary as fallback
            file_list = ", ".join([f["filename"] for f in processed_files if "filename" in f])
            return {
                "response": f"I've successfully processed your files: {file_list}. However, I encountered an error during analysis. The files contain financial data that I can help you interpret. What would you like to know?",
                "suggestions": [
                    "Show file summary",
                    "Calculate totals",
                    "Identify patterns",
                    "Export processed data"
                ]
            }
    
    async def transcribe_and_respond(self,
                                    audio_path: str,
                                    session_id: Optional[str] = None,
                                    mcp_context: Optional[str] = None) -> Dict[str, Any]:
        """Process audio using Gemini (it has built-in audio capabilities)"""
        if not self.client:
            return {
                "transcription": "",
                "response": "Audio processing is not available. Please type your question.",
                "suggestions": ["Try typing", "Check API key"]
            }
        
        try:
            # Get conversation history
            history = []
            if session_id:
                history = self.get_conversation_history(session_id)
            
            # Build conversation context
            conversation_context = ""
            if history:
                conversation_context = "\n**PREVIOUS CONVERSATION:**\n"
                for msg in history[-6:]:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    conversation_context += f"{role}: {msg['content'][:200]}...\n"
                conversation_context += "\n"
            
            # Upload audio file to Gemini
            audio_file = genai.upload_file(audio_path)
            
            prompt = f"""Listen to this audio message from a user asking about their finances.

{mcp_context if mcp_context else 'No financial data available.'}

{conversation_context}

Please:
1. Transcribe what the user said accurately
2. Consider the previous conversation context
3. Provide a helpful financial response based on their question
4. Use the financial context provided above if relevant

Format your response as:
TRANSCRIPTION: [what the user said]

RESPONSE: [your financial advice considering conversation history]"""
            
            # Gemini supports audio input
            response = self.client.generate_content([prompt, audio_file])
            
            # Parse response
            response_text = response.text
            if "TRANSCRIPTION:" in response_text and "RESPONSE:" in response_text:
                parts = response_text.split("RESPONSE:")
                transcription = parts[0].replace("TRANSCRIPTION:", "").strip()
                ai_response = parts[1].strip()
            else:
                transcription = "Audio processed"
                ai_response = response_text
            
            # Add to conversation history
            if session_id:
                self.add_to_history(session_id, "user", f"[Voice] {transcription}")
                self.add_to_history(session_id, "assistant", ai_response)
            
            return {
                "transcription": transcription,
                "response": ai_response,
                "suggestions": [
                    "Tell me more",
                    "Show details",
                    "What about investments?",
                    "Budget advice"
                ]
            }
        
        except Exception as e:
            print(f"❌ Audio processing error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "transcription": "",
                "response": "I had trouble processing your voice message. Please try again or type your question instead.",
                "suggestions": ["Try again", "Type instead"]
            }

# Global instance
gemini_multimodal = GeminiMultimodalService()
