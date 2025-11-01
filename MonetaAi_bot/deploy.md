docker buildx create --name mybuilder --driver docker-container --use

docker buildx inspect --bootstrap


---------------------------------------


aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 829710535347.dkr.ecr.us-east-1.amazonaws.com


---------------------------------------

docker buildx build --platform linux/amd64 --output type=registry --provenance=false --sbom=false -t 829710535347.dkr.ecr.us-east-1.amazonaws.com/monetai-lambda:v2 .

aws lambda update-function-code --function-name monetai-lambda --image-uri 829710535347.dkr.ecr.us-east-1.amazonaws.com/monetai-lambda:v2