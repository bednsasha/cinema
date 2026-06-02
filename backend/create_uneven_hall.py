import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cinema.models import SeatType, ScreenType, Hall, HallScreen, Seat

def create_uneven_hall():
    print("Создаём типы мест...")
    standard, _ = SeatType.objects.get_or_create(
        name='standard', 
        defaults={'display_name': 'Обычное', 'slug': 'standard'}
    )
    vip, _ = SeatType.objects.get_or_create(
        name='vip', 
        defaults={'display_name': 'VIP', 'slug': 'vip'}
    )
    sofa, _ = SeatType.objects.get_or_create(
        name='sofa', 
        defaults={'display_name': 'Диванчик', 'slug': 'sofa'}
    )
    print("  - Типы мест созданы")

    print("Создаём типы экранов...")
    for name in ['2D', '3D']:
        ScreenType.objects.get_or_create(name=name, defaults={'slug': name.lower()})
    print("  - Типы экранов созданы")

    print("Создаём зал...")
    hall, _ = Hall.objects.get_or_create(
        name='Малый зал (тестовый)',
        defaults={'slug': 'malyj-zal-testovyj'}
    )
    print(f"  - Зал: {hall.name}")

    # Очищаем старые места
    Seat.objects.filter(hall=hall).delete()
    print("  - Старые места удалены")

    print("Создаём места с неравномерным расположением...")

    seats_data = [
        # Ряд 1: 5 мест с проходом посередине
        # y=100
        {'row': 1, 'seat': 1, 'seat_type': standard, 'x': 50, 'y': 100},
        {'row': 1, 'seat': 2, 'seat_type': standard, 'x': 90, 'y': 100},
        {'row': 1, 'seat': 3, 'seat_type': standard, 'x': 130, 'y': 100},
        # проход (между 3 и 4) — нет мест
        {'row': 1, 'seat': 4, 'seat_type': standard, 'x': 210, 'y': 100},
        {'row': 1, 'seat': 5, 'seat_type': standard, 'x': 250, 'y': 100},
        
        # Ряд 2: смещён вправо (начинается с x=90)
        # y=160
        {'row': 2, 'seat': 1, 'seat_type': standard, 'x': 90, 'y': 160},
        {'row': 2, 'seat': 2, 'seat_type': standard, 'x': 130, 'y': 160},
        {'row': 2, 'seat': 3, 'seat_type': standard, 'x': 170, 'y': 160},
        {'row': 2, 'seat': 4, 'seat_type': standard, 'x': 210, 'y': 160},
        {'row': 2, 'seat': 5, 'seat_type': standard, 'x': 250, 'y': 160},
        
        # Ряд 3: пустое место в середине (нет мест 3)
        # y=220
        {'row': 3, 'seat': 1, 'seat_type': standard, 'x': 50, 'y': 220},
        {'row': 3, 'seat': 2, 'seat_type': standard, 'x': 90, 'y': 220},
        # место 3 пропущено (пустота)
        {'row': 3, 'seat': 4, 'seat_type': standard, 'x': 170, 'y': 220},
        {'row': 3, 'seat': 5, 'seat_type': standard, 'x': 210, 'y': 220},
        {'row': 3, 'seat': 6, 'seat_type': standard, 'x': 250, 'y': 220},
        
        # Ряд 4: диван (2 места как один объект)
        # y=280 — диван занимает места 1 и 2
        {'row': 4, 'seat': 1, 'seat_type': sofa, 'x': 50, 'y': 280, 'width': 80},
        {'row': 4, 'seat': 2, 'seat_type': sofa, 'x': 130, 'y': 280, 'width': 80},
        # проход
        {'row': 4, 'seat': 3, 'seat_type': standard, 'x': 210, 'y': 280},
        {'row': 4, 'seat': 4, 'seat_type': standard, 'x': 250, 'y': 280},
        
        # Ряд 5: полный ряд с VIP в центре
        # y=340
        {'row': 5, 'seat': 1, 'seat_type': standard, 'x': 30, 'y': 340},
        {'row': 5, 'seat': 2, 'seat_type': standard, 'x': 70, 'y': 340},
        {'row': 5, 'seat': 3, 'seat_type': vip,      'x': 110, 'y': 340},  # VIP место
        {'row': 5, 'seat': 4, 'seat_type': vip,      'x': 150, 'y': 340},  # VIP место
        {'row': 5, 'seat': 5, 'seat_type': standard, 'x': 190, 'y': 340},
        {'row': 5, 'seat': 6, 'seat_type': standard, 'x': 230, 'y': 340},
        {'row': 5, 'seat': 7, 'seat_type': standard, 'x': 270, 'y': 340},
        {'row': 5, 'seat': 8, 'seat_type': standard, 'x': 310, 'y': 340},
    ]

    for data in seats_data:
        seat, created = Seat.objects.get_or_create(
            hall=hall,
            row_number=data['row'],
            seat_number=data['seat'],
            defaults={
                'seat_type': data['seat_type'],
                'position_x': data['x'],
                'position_y': data['y'],
                'width': data.get('width', 40),
                'height': 40
            }
        )
        if created:
            print(f"  ✓ Ряд {data['row']}, место {data['seat']} - {data['seat_type'].display_name} (x={data['x']}, y={data['y']})")

    seat_count = Seat.objects.filter(hall=hall).count()
    print(f"\n✅ Создано {seat_count} мест в зале '{hall.name}'")
    
    # Выводим схему текстом
    print("\n📊 Схема зала:")
    print("Ряд 1:  [1][2][3]    [4][5]  (проход между 3 и 4)")
    print("Ряд 2:     [1][2][3][4][5]   (смещён вправо)")
    print("Ряд 3:  [1][2]    [4][5][6]  (нет места 3)")
    print("Ряд 4:  [ДИВАН][ДИВАН]  [3][4] (диван на 2 места)")
    print("Ряд 5:  [1][2][VIP][VIP][5][6][7][8] (VIP в центре)")

if __name__ == '__main__':
    create_uneven_hall()