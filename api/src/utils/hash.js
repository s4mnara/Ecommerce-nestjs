const bcrypt = require('bcryptjs');


const plainTextPassword = 'minhaSenhaSegura123';
const saltRounds = 10; 

async function hashPassword() {
  try {
    const hash = await bcrypt.hash(plainTextPassword, saltRounds);
    console.log('----------------------------------------------------');
    console.log(`SENHA PLAIN: ${plainTextPassword}`);
    console.log(`SENHA HASH: ${hash}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Erro ao gerar hash:', err);
  }
}

hashPassword();