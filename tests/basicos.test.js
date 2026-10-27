import { grupo, test, igual } from './runner.js';
import { normalizar } from '../src/logica/normalizar.js';
import { leerCsv } from '../src/logica/csv.js';
import {
  formatearEuros, formatearImporte, formatearNumero, formatearPorcentaje, parsearNumero,
} from '../src/logica/formato.js';

const E = ' €';

grupo('Normalizar textos', () => {
  test('quita tildes y pasa a minúsculas', () => igual(normalizar('Castellón'), 'castellon'));
  test('quita espacios sobrantes', () => igual(normalizar('  La   Coruña  '), 'la coruna'));
  test('mayúsculas con tilde', () => igual(normalizar('ÁVILA'), 'avila'));
});

grupo('Lectura de CSV', () => {
  test('separado por comas', () => {
    const r = leerCsv('a,b\n1,2\n');
    igual(r.cabecera, ['a', 'b']);
    igual(r.filas, [{ a: '1', b: '2' }]);
  });
  test('detecta punto y coma (Excel en español)', () => {
    const r = leerCsv('a;b\n1,5;2\n');
    igual(r.separador, ';');
    igual(r.filas[0], { a: '1,5', b: '2' });
  });
  test('ignora BOM, líneas vacías y saltos de línea Windows', () => {
    const r = leerCsv('﻿a,b\r\n\r\n1,2\r\n,\r\n');
    igual(r.cabecera, ['a', 'b']);
    igual(r.filas.length, 1);
  });
  test('campos entre comillas con comas y comillas dobles', () => {
    const r = leerCsv('a,b\n"x, y","di ""hola"""\n');
    igual(r.filas[0], { a: 'x, y', b: 'di "hola"' });
  });
  test('fichero vacío', () => igual(leerCsv('').cabecera, []));
});

grupo('Formato español', () => {
  test('euros con miles y decimales', () => igual(formatearEuros(123456), `1.234,56${E}`));
  test('euros pequeños', () => igual(formatearEuros(420), `4,20${E}`));
  test('cero euros', () => igual(formatearEuros(0), `0,00${E}`));
  test('millones', () => igual(formatearEuros(123456789), `1.234.567,89${E}`));
  test('importe sin símbolo', () => igual(formatearImporte(59840), '598,40'));
  test('números sin ceros sobrantes', () => {
    igual(formatearNumero(6.5), '6,5');
    igual(formatearNumero(120), '120');
    igual(formatearNumero(1234.5), '1.234,5');
  });
  test('porcentaje con un decimal', () => igual(formatearPorcentaje(6.373), '6,4 %'));
  test('lee números con punto o coma', () => {
    igual(parsearNumero('1.8'), 1.8);
    igual(parsearNumero('1,8'), 1.8);
    igual(parsearNumero(' 34 '), 34);
    igual(parsearNumero('1.234,5'), 1234.5);
  });
  test('vacío es null y texto es NaN', () => {
    igual(parsearNumero(''), null);
    igual(Number.isNaN(parsearNumero('abc')), true);
    igual(Number.isNaN(parsearNumero('1,2,3')), true);
  });
});
