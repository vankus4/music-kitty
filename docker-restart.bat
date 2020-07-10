docker stop music-kitty-container
docker rm music-kitty-container
docker image rm music-kitty
docker image build -t music-kitty .
docker run -it --name music-kitty-container music-kitty