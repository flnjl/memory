# Construction du conteneur :
#  - aller dans le répertoire qui contient l'application
#  - docker build -t memory .
# Lancement du conteneur :
#  - docker run -d --name memory_container -p 8080:80 memory

# Utilisation de l'image Docker php
FROM php

# Copie des sources dans le répertoire /usr/app de la machine
COPY . /usr/app

# Exécution du serveur interne PHP sur le répertoire 
# au lancement du conteneur
CMD ["php", "-S", "0.0.0.0:80", "-t", "/usr/app"]
