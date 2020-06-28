FROM continuumio/miniconda3:latest

LABEL maintainer="YuxuanZhu"

# Install shared libs and rsync
# also install nodejs npm
RUN apt-get -qq update && \
    apt-get install -y rsync \
    libglu1 \
    libgl1 && \
    apt-get -y install build-essential libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    librsvg2-dev && \
    apt-get install -y curl software-properties-common && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs

# Set ENV variables
ENV HOME=/usgs
ENV ISISROOT=$HOME/isis3 ISIS3DATA=$HOME/data
ENV PATH=$PATH:$ISISROOT/bin


# Create user and home
RUN useradd --create-home --home-dir $HOME --shell /bin/bash usgs

# install isis3
COPY . $HOME/
WORKDIR $HOME

# Sync ISIS with conda
RUN conda config --add channels conda-forge && \
    conda config --add channels usgs-astrogeology && \
    conda create -y --prefix ${ISISROOT} && \
    conda install -y --prefix ${ISISROOT} isis3

# Sync partial `base` data
RUN rsync -azv --delete --partial --inplace \
	--exclude='dems/*.cub' \
    --exclude='testData' \
    isisdist.astrogeology.usgs.gov::isis3data/data/base $ISIS3DATA && \
    rm -rf $ISISROOT/doc $ISISROOT/docs

# Add Isis User Preferences
RUN mkdir -p $HOME/.Isis && echo "Group = UserInterface\n\
  ProgressBar      = Off\n\
  HistoryRecording = Off\n\
EndGroup\n\
\n\
Group = SessionLog\n\
  TerminalOutput = Off\n\
  FileOutput     = Off\n\
EndGroup" > $HOME/.Isis/IsisPreferences



# move to working directory
WORKDIR $HOME
WORKDIR ISISapp

# install all modules and update canvas and update binaries
RUN npm install

# expose containers port 3000
EXPOSE 3000

# set the run command
CMD ["node","app.js"]

# docker run --rm --name server -p 3000:3000 25350