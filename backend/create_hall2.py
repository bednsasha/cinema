# create_hall2.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cinema.models import SeatType, ScreenType, Hall, HallScreen, Seat

def create_hall2():
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
    for name in ['2D', '3D', 'IMAX']:
        ScreenType.objects.get_or_create(name=name, defaults={'slug': name.lower()})
    print("  - Типы экранов созданы")

    print("Создаём зал...")
    hall, _ = Hall.objects.get_or_create(
        name='Большой зал (тестовый)',
        defaults={'slug': 'bolshoj-zal-testovyj'}
    )
    print(f"  - Зал: {hall.name}")

    # Очищаем старые места
    Seat.objects.filter(hall=hall).delete()
    print("  - Старые места удалены")

    print("Создаём места с неравномерным расположением...")

    seats_data = [
        # Ряд 1: 7 мест с проходом после 4 места
        {'row': 1, 'seat': 1, 'seat_type': standard, 'x': 50, 'y': 100},
        {'row': 1, 'seat': 2, 'seat_type': standard, 'x': 90, 'y': 100},
        {'row': 1, 'seat': 3, 'seat_type': standard, 'x': 130, 'y': 100},
        {'row': 1, 'seat': 4, 'seat_type': standard, 'x': 170, 'y': 100},
        # проход (между 4 и 5) — нет мест
        {'row': 1, 'seat': 5, 'seat_type': standard, 'x': 250, 'y': 100},
        {'row': 1, 'seat': 6, 'seat_type': standard, 'x': 290, 'y': 100},
        {'row': 1, 'seat': 7, 'seat_type': standard, 'x': 330, 'y': 100},
        
        # Ряд 2: VIP в центре, 8 мест
        {'row': 2, 'seat': 1, 'seat_type': standard, 'x': 30, 'y': 160},
        {'row': 2, 'seat': 2, 'seat_type': standard, 'x': 70, 'y': 160},
        {'row': 2, 'seat': 3, 'seat_type': vip, 'x': 110, 'y': 160},
        {'row': 2, 'seat': 4, 'seat_type': vip, 'x': 150, 'y': 160},
        {'row': 2, 'seat': 5, 'seat_type': vip, 'x': 190, 'y': 160},
        {'row': 2, 'seat': 6, 'seat_type': vip, 'x': 230, 'y': 160},
        {'row': 2, 'seat': 7, 'seat_type': standard, 'x': 270, 'y': 160},
        {'row': 2, 'seat': 8, 'seat_type': standard, 'x': 310, 'y': 160},
        
        # Ряд 3: диваны слева и справа, VIP по центру
        {'row': 3, 'seat': 1, 'seat_type': sofa, 'x': 30, 'y': 220, 'width': 80},
        {'row': 3, 'seat': 2, 'seat_type': sofa, 'x': 90, 'y': 220, 'width': 80},
        {'row': 3, 'seat': 3, 'seat_type': vip, 'x': 150, 'y': 220},
        {'row': 3, 'seat': 4, 'seat_type': vip, 'x': 190, 'y': 220},
        {'row': 3, 'seat': 5, 'seat_type': vip, 'x': 230, 'y': 220},
        {'row': 3, 'seat': 6, 'seat_type': sofa, 'x': 290, 'y': 220, 'width': 80},
        {'row': 3, 'seat': 7, 'seat_type': sofa, 'x': 330, 'y': 220, 'width': 80},
        
        # Ряд 4: обычные места с проходом посередине, 10 мест
        {'row': 4, 'seat': 1, 'seat_type': standard, 'x': 30, 'y': 280},
        {'row': 4, 'seat': 2, 'seat_type': standard, 'x': 70, 'y': 280},
        {'row': 4, 'seat': 3, 'seat_type': standard, 'x': 110, 'y': 280},
        {'row': 4, 'seat': 4, 'seat_type': standard, 'x': 150, 'y': 280},
        # проход
        {'row': 4, 'seat': 5, 'seat_type': standard, 'x': 230, 'y': 280},
        {'row': 4, 'seat': 6, 'seat_type': standard, 'x': 270, 'y': 280},
        {'row': 4, 'seat': 7, 'seat_type': standard, 'x': 310, 'y': 280},
        {'row': 4, 'seat': 8, 'seat_type': standard, 'x': 350, 'y': 280},
        {'row': 4, 'seat': 9, 'seat_type': standard, 'x': 390, 'y': 280},
        {'row': 4, 'seat': 10, 'seat_type': standard, 'x': 430, 'y': 280},
        
        # Ряд 5: VIP и диваны, 6 мест
        {'row': 5, 'seat': 1, 'seat_type': vip, 'x': 50, 'y': 340},
        {'row': 5, 'seat': 2, 'seat_type': vip, 'x': 90, 'y': 340},
        {'row': 5, 'seat': 3, 'seat_type': sofa, 'x': 150, 'y': 340, 'width': 100},
        {'row': 5, 'seat': 4, 'seat_type': sofa, 'x': 230, 'y': 340, 'width': 100},
        {'row': 5, 'seat': 5, 'seat_type': vip, 'x': 310, 'y': 340},
        {'row': 5, 'seat': 6, 'seat_type': vip, 'x': 350, 'y': 340},
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
    
    print("\n📊 Схема зала:")
    print("Ряд 1:  [1][2][3][4]    [5][6][7]  (проход после 4)")
    print("Ряд 2:  [1][2][VIP][VIP][VIP][VIP][7][8]  (VIP в центре)")
    print("Ряд 3:  [ДИВАН][ДИВАН][VIP][VIP][VIP][ДИВАН][ДИВАН]")
    print("Ряд 4:  [1][2][3][4]    [5][6][7][8][9][10]  (10 мест, проход после 4)")
    print("Ряд 5:  [VIP][VIP][ДИВАН][ДИВАН][VIP][VIP]  (VIP по краям, диваны в центре)")

if __name__ == '__main__':
    create_hall2()