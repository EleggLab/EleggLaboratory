#!/usr/bin/env python3
import os

def handle(msg:str)->str:
    if msg.lower().strip() in ('hi','hello'):
        return 'hello!'
    return f'echo: {msg}'

if __name__=='__main__':
    print('bot starter running. type text, ctrl+c to exit')
    while True:
        try:
            m=input('> ')
            print(handle(m))
        except (EOFError, KeyboardInterrupt):
            print('\nbye')
            break
