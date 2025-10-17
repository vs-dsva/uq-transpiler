// Vercel serverless function for transpiling Concept code
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Import the transpiler modules
    // Note: We'll need to adjust imports for Vercel's environment
    const { tokenize } = await import('../lexer.js');
    const { parse } = await import('../parser.js');
    const { generateJS } = await import('../generator.js');

    // Tokenize the input
    const tokens = tokenize(code);
    
    // Parse the tokens into an AST
    const ast = parse(tokens);
    
    // Generate JavaScript code
    const jsCode = generateJS(ast);
    
    return res.status(200).json({
      success: true,
      result: jsCode,
      tokens: tokens,
      ast: ast
    });
    
  } catch (error) {
    console.error('Transpiler error:', error);
    return res.status(500).json({
      error: 'Transpilation failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}