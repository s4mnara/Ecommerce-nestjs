import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCPF(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsCPF',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (!value) return true; // CPF é opcional

          const cpf = value.replace(/\D/g, '');

          if (cpf.length !== 11) return false;
          if (/^(\d)\1{10}$/.test(cpf)) return false;

          let soma = 0;
          let resto;

          for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
          }

          resto = (soma * 10) % 11;
          if (resto === 10 || resto === 11) resto = 0;
          if (resto !== parseInt(cpf.substring(9, 10))) return false;

          soma = 0;
          for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
          }

          resto = (soma * 10) % 11;
          if (resto === 10 || resto === 11) resto = 0;

          return resto === parseInt(cpf.substring(10, 11));
        },
      },
    });
  };
}
