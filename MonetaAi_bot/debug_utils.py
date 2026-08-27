import os

# Desligado por padrão -- os logs de DEBUG hoje despejam dados financeiros e
# telefones em texto puro no CloudWatch. Só liga de propósito, setando
# MONETA_DEBUG=true na variável de ambiente da Lambda, quando precisar
# investigar algo pontualmente.
DEBUG = os.environ.get("MONETA_DEBUG", "").strip().lower() in ("1", "true", "yes")


def debug_print(*args, **kwargs):
    if DEBUG:
        print(*args, **kwargs)
