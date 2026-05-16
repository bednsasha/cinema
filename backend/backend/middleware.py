from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.http import JsonResponse

class PasswordChangeMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Проверяем, не менялся ли пароль после выдачи токена
        auth = JWTAuthentication()
        try:
            result = auth.authenticate(request)
            if result:
                user, token = result
                last_password_change = user.last_password_change.timestamp()
                token_last_change = float(token.get('last_password_change', 0))
                
                if last_password_change > token_last_change + 1:
                    return JsonResponse(
                        {"detail": "Пароль был изменён. Войдите заново."},
                        status=401
                    )
        except InvalidToken:
            pass
        return None