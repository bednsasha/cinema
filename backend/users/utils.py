import random

def generate_verification_code():
    return f"{random.randint(100000, 999999)}"

def print_verification_code(email, first_name, code, purpose='registration'):
    if purpose == 'registration':
        print(f"\n{'='*50}")
        print(f"РЕГИСТРАЦИЯ")
        print(f"Email: {email}")
        print(f"Код подтверждения: {code}")
        print(f"{'='*50}\n")
    elif purpose == 'password_reset':
        print(f"\n{'='*50}")
        print(f"ВОССТАНОВЛЕНИЕ ПАРОЛЯ")
        print(f"Email: {email}")
        print(f"Код подтверждения: {code}")
        print(f"{'='*50}\n")