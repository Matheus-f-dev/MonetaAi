# Use a runtime base image oficial de Lambda Python
FROM public.ecr.aws/lambda/python:3.9

# Copie requirements primeiro para melhor cache
COPY requirements.txt ./
RUN pip install -r requirements.txt --no-cache-dir

# Copiar todo o código fonte (garante inclusão de novos arquivos como session_context.py, frontend, etc.)
# Recomenda-se criar um .dockerignore para excluir __pycache__, arquivos locais de dev, etc.
COPY . .

# Defina o handler (arquivo.função)
CMD ["app.lambda_handler"]
