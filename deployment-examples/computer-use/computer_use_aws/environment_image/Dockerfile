FROM public.ecr.aws/ubuntu/ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBIAN_PRIORITY=high

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install \
    build-essential \
    # UI Requirements
    xvfb \
    xterm \
    dbus \
    dbus-x11 \
    x11-xserver-utils \
    xdotool \
    scrot \
    imagemagick \
    sudo \
    mutter \
    x11vnc \
    # Python/pyenv reqs
    build-essential \
    libssl-dev  \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    curl \
    git \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libxml2-dev \
    libxmlsec1-dev \
    libffi-dev \
    liblzma-dev \
    # Network tools
    net-tools \
    netcat \
    # PPA req
    software-properties-common && \
    # Userland apps
    sudo add-apt-repository ppa:mozillateam/ppa && \
    sudo apt-get install -y --no-install-recommends \
    libreoffice \
    firefox-esr \
    x11-apps \
    xpdf \
    gedit \
    xpaint \
    tint2 \
    galculator \
    pcmanfm \
    unzip && \
    apt-get clean

RUN apt-get install -y wget

# Install Amazon DCV
RUN wget https://d1uj6qtbmh3dt5.cloudfront.net/NICE-GPG-KEY && \
    gpg --import NICE-GPG-KEY && \
    wget https://d1uj6qtbmh3dt5.cloudfront.net/2024.0/Servers/nice-dcv-2024.0-17979-ubuntu2204-aarch64.tgz && \
    tar -xvzf nice-dcv-2024.0-17979-ubuntu2204-aarch64.tgz && \
    cd nice-dcv-2024.0-17979-ubuntu2204-aarch64 && \
    apt install -y ./nice-dcv-server_2024.0.17979-1_arm64.ubuntu2204.deb && \
    apt install -y ./nice-dcv-web-viewer_2024.0.17979-1_arm64.ubuntu2204.deb && \
    cd .. && \
    rm -rf nice-dcv-2024.0-17979-ubuntu2204-aarch64*

# setup user
ENV USERNAME=computeruse
ENV HOME=/home/$USERNAME
RUN useradd -m -s /bin/bash -d $HOME $USERNAME
RUN echo "${USERNAME} ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
RUN usermod -aG video $USERNAME

# Add after DCV installation and before switching to non-root user
RUN mkdir -p /var/run/dcv && \
    mkdir -p /var/log/dcv && \
    chown -R $USERNAME:$USERNAME /var/run/dcv && \
    chown -R $USERNAME:$USERNAME /var/log/dcv && \
    chmod 755 /var/run/dcv && \
    chmod 755 /var/log/dcv && \
    mkdir -p /etc/dcv && \
    echo -e "[security]\nauthentication=none\n\n[display/linux]\ndisable-local-console=false" > /etc/dcv/dcv.conf && \
    echo "computeruse:admin" | chpasswd

# Copy the dbus config file to allow non-root users
COPY --chown=root:root ./image/dbus.conf /etc/dbus-1/system.d/dcv-server.conf

USER computeruse
WORKDIR $HOME

# setup python
RUN git clone https://github.com/pyenv/pyenv.git ~/.pyenv && \
    cd ~/.pyenv && src/configure && make -C src && cd .. && \
    echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc && \
    echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc && \
    echo 'eval "$(pyenv init -)"' >> ~/.bashrc
ENV PYENV_ROOT="$HOME/.pyenv"
ENV PATH="$PYENV_ROOT/bin:$PATH"
ENV PYENV_VERSION_MAJOR=3
ENV PYENV_VERSION_MINOR=11
ENV PYENV_VERSION_PATCH=6
ENV PYENV_VERSION=$PYENV_VERSION_MAJOR.$PYENV_VERSION_MINOR.$PYENV_VERSION_PATCH
RUN eval "$(pyenv init -)" && \
    pyenv install $PYENV_VERSION && \
    pyenv global $PYENV_VERSION && \
    pyenv rehash
ENV PATH="$HOME/.pyenv/shims:$HOME/.pyenv/bin:$PATH"
RUN python -m pip install --upgrade pip==23.1.2 setuptools==58.0.4 wheel==0.40.0 && \
    python -m pip config set global.disable-pip-version-check true

# only reinstall if requirements.txt changes
COPY --chown=$USERNAME:$USERNAME requirements.txt $HOME/computer_use_demo/requirements.txt
RUN python -m pip install -r $HOME/computer_use_demo/requirements.txt

# setup desktop env & app
COPY --chown=$USERNAME:$USERNAME image/ $HOME
RUN chmod +x $HOME/entrypoint.sh $HOME/dvc_startup.sh
COPY --chown=$USERNAME:$USERNAME computer_use_demo/ $HOME/computer_use_demo/
ARG DISPLAY_NUM=1
ARG HEIGHT=768
ARG WIDTH=1024
ENV DISPLAY_NUM=$DISPLAY_NUM
ENV HEIGHT=$HEIGHT
ENV WIDTH=$WIDTH

# Expose ports
EXPOSE 5000
EXPOSE 8443

ENTRYPOINT [ "./entrypoint.sh" ]
