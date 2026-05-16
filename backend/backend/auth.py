from rest_framework_simplejwt.tokens import AccessToken
from users.models import Customer

class CustomAccessToken(AccessToken):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token['last_password_change'] = str(user.last_password_change.timestamp())
        return token