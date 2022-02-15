FROM openjdk:8-jre

# Update Apt
RUN apt-get update

# Add Crunch
COPY src/main/resources/executables/crunch_3.6-3_amd64.deb crunch.deb
RUN apt-get install ./crunch.deb
# OR Get it through apt
#RUN apt-get update && apt-get --yes install crunch && rm -rf /var/lib/apt/lists/*

# Add cap2hccapx
COPY src/main/resources/executables/cap2hccapx cap2hccapx
# OR Get it through wget
# https://raw.githubusercontent.com/hashcat/hashcat-utils/master/src/cap2hccapx
RUN mv cap2hccapx /bin

# Add a kraken user to run our application so that it doesn't need to run as root
RUN useradd -ms /bin/bash kraken
WORKDIR /home/kraken

# Copy Password Lists
ADD src/main/resources/lists lists

# Copy the config file explicitly
COPY src/main/resources/application.yaml application.yaml

# Copy the jar file from build into the container
COPY ./build/libs/kraken-server.jar kraken-server.jar

CMD ["echo", "Trying to run Kraken? Override required configurations values and try again, eg java [args] -jar kraken-server.jar See https://github.com/arcaneiceman for help"]
