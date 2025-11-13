const crypto = require('crypto');

function generateHash(secret) {
  // Usando o algoritmo SHA-256 para criar o hash do segredo fornecido
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  console.log('Generated Hash:', hash);
  return hash;
}

// Defina seu segredo aqui
const secret = 'algumSegredoSecreto';  // Altere para o segredo desejado
generateHash(secret);