from core.constants import (
    BASE_TICKET_PRICE,
    SEAT_TYPE_COEFFICIENTS,
    TIME_COEFFICIENTS,
    RENTAL_WEEK_COEFFICIENTS
)


def calculate_ticket_price(session, seat_type):
    
    if not session or not seat_type:
        return BASE_TICKET_PRICE
    
    price = BASE_TICKET_PRICE
    
    seat_coeff = SEAT_TYPE_COEFFICIENTS.get(seat_type, 1.0)
    price *= seat_coeff
    
    hour = session.start_time.hour
    if hour < 12:
        time_coeff = TIME_COEFFICIENTS['morning']
    elif hour < 17:
        time_coeff = TIME_COEFFICIENTS['afternoon']
    elif hour < 22:
        time_coeff = TIME_COEFFICIENTS['evening']
    else:
        time_coeff = TIME_COEFFICIENTS['night']
    price *= time_coeff
    
    rental = session.rental
    if rental and rental.date_rental_start:
        days_in_rent = (session.start_time.date() - rental.date_rental_start).days
        if days_in_rent < 0:
            week = 1  
        else:
            week = min(days_in_rent // 7 + 1, 4)
        rental_coeff = RENTAL_WEEK_COEFFICIENTS.get(week, 0.8)
        price *= rental_coeff
    
    return round(price, 2)