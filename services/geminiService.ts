
import { GoogleGenAI } from "@google/genai";

// Generate code for bot files using gemini-3-pro-preview for complex coding tasks
export const generateCode = async (prompt: string, language: string, currentCode: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const systemInstruction = `You are an expert developer specializing in ${language}. 
    Your task is to generate clean, production-ready code for a Discord bot.
    Return ONLY the full updated code. No explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const text = response.text || "";
    return text.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("AI generateCode error:", error);
    return null;
  }
};

// Process console commands to simulate bot output
export const processBotCommand = async (command: string, files: { name: string, content: string }[], language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const codeSummary = files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n');
  
  // Hardcoded System Commands for realism
  if (command === 'npm list' || command === 'pip list') {
    return [`[SYSTEM] Scanning local dependencies...`, `[SYSTEM] discord.js@latest`, `[SYSTEM] dotenv@latest`, `[SYSTEM] node-fetch@latest`].map(l => l);
  }
  if (command === 'whoami') return [`container@nova-hosting`];
  if (command === 'ls') return files.map(f => f.name);

  try {
    const prompt = `Act as the terminal output of a running Discord bot. 
    The user entered a command in the console: "${command}".
    
    Look at the bot's source code below. 
    1. If the code defines a command (like "!ping", "/help", etc.) and the user's input matches it, simulate the bot's terminal log for executing that command.
    2. If it's a generic command, simulate how the bot framework (discord.js or discord.py) would log a "message received" event.
    3. Include technical details like latency or user IDs if appropriate.
    
    Output 1-3 lines of RAW TERMINAL LOGS ONLY. No explanations.
    
    CODE:
    ${codeSummary}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const text = response.text || "";
    return text.split('\n').filter(l => l.trim().length > 0).map(l => l.trim());
  } catch (error) {
    console.error("AI processBotCommand error:", error);
    return [`[DEBUG] Command received at gateway: ${command}`, `[DEBUG] Shard 0: No local handler found, event discarded.`];
  }
};

// Simulate terminal execution logs based on source code
export const simulateExecution = async (files: { name: string, content: string }[], language: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const codeSummary = files.map(f => f.content).join('\n');
  
  // Basic pre-check for a token or login call
  const hasToken = /token|TOKEN|client\.login|bot\.run|auth/i.test(codeSummary);
  
  if (!hasToken) {
    return [
      `[ERROR] Authentication failed: No Discord Token found in source.`,
      `[ERROR] Please add "client.login('YOUR_TOKEN')" or "TOKEN = '...'" to your main file.`,
      `[SYSTEM] Container process terminated with exit code 1.`
    ];
  }

  const fallback = [
    `[INFO] Starting container process...`,
    `[INFO] ${language.toUpperCase()} runtime initialized.`,
    `[DEBUG] Connection to Discord Gateway established.`,
    `[SUCCESS] Bot is now online and listening for commands.`
  ];
  
  try {
    const prompt = `Act as a Linux terminal for a Discord bot hosting service.
    Analyze the code. If it's a valid bot, show 5 lines of realistic Discord.js/Discord.py logs.
    Show things like "Shards spawning", "Gateway connected", and "Ready as [BotName]".
    If the code has obvious syntax errors, show those instead.
    
    CODE:
    ${codeSummary}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const text = response.text || "";
    return text
      .replace(/```[a-z]*\n/g, '')
      .replace(/```/g, '')
      .split('\n')
      .filter(l => l.trim().length > 0)
      .map(l => l.trim());
  } catch (error) {
    console.error("AI simulateExecution error:", error);
    return fallback;
  }
};

// Analyze terminal logs to provide debugging insights
export const analyzeLogs = async (logLines: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const logs = logLines.join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a DevOps expert. Analyze these terminal logs from a Discord bot and explain what's wrong and how to fix it in 1-2 concise sentences.
      
      LOGS:
      ${logs}`,
    });

    return response.text || "No analysis available for these logs.";
  } catch (error) {
    console.error("AI analyzeLogs error:", error);
    return "The AI engine is currently busy. Please try again in a moment.";
  }
};
