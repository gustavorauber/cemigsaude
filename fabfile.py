# -*- coding: utf-8 -*-
'''
Created on 18/09/2014

@author: c057384
'''

from fabric.api import env, sudo, run, cd, local, settings, hide, parallel, put
from fabric.colors import red, green
from fabric.contrib.files import exists, sed

from StringIO import StringIO

import time

env.project_name = 'saude'
env.project_path = '/cemig/' + env.project_name
env.deploy_user = 'cemig:cemig'

def __green(msg):
    print green(msg.encode('utf8'))
    
def __red(msg):
    print red(msg.encode('utf8'))    

def setup_pkgs():
    """
    Instala os pacotes necessários da distribuição
    """
    
    # Packages for python
    packages = ['python2.7', 'python2.7-dev', 'python-setuptools', 
                'python-virtualenv python-pip']
    
    # Git
    packages.extend(['git'])
    
    # Supervisor
    packages.extend(['supervisor'])
    
    # memcached
    packages.extend(['memcached', 'libmemcached-dev'])
    
    # logrotate
    packages.extend(['logrotate'])
    
    # uwsgi
    packages.extend(['uwsgi', 'uwsgi-plugin-python'])    
    
    # monit
    packages.extend(['monit'])
    
    # locale issues
    packages.extend(['language-pack-en-base'])
    
    # elasticsearch
    packages.extend(['elasticsearch', 'openjdk-7-jre'])
    
    # mongodb
    packages.extend(['mongodb-server'])
    
    # Packages for nginx
    packages.extend(['libpcre3-dev', 'zlib1g-dev', 'libssl-dev', 'libmhash-dev',
                     'libfreetype6-dev', 'nginx-full'])    
    
    sudo('sudo apt-get -y update')     
    sudo('sudo apt-get -y install ' + ' '.join(packages))
    
    __green(u'Pacotes da distribuição instalados')
    
    
def __upload_tar_from_git(dev=False, branch=None):
    """
    Cria um ZIP com o conteúdo atual do Git e faz o upload para o servidor    
    """
    if not branch:
        branch = 'master' if not dev else 'develop'
    
    local('git archive --format=tar %s | gzip > %s.tar.gz' % (branch, env.release))
    sudo('mkdir -p %s/releases/%s' % (env.project_path, env.release))
    sudo('chown -R %s %s/releases/%s' % (env.deploy_user, env.project_path, env.release))
    put('%s.tar.gz' % (env.release), '%s/packages/' % (env.project_path), use_sudo=True)
    with cd('%s/releases/%s' % (env.project_path, env.release)):
        sudo('tar zxf ../../packages/%s.tar.gz' % (env.release))
    sudo('chown -R %s %s/releases/%s' % (env.deploy_user, env.project_path, env.release))
    
    #@TODO: update permissions on sensitive configuration files

    local('rm %s.tar.gz' % (env.release))
    
    __green(u'Release transferida ao servidor')

def __symlink_current_release():
    """
    Atualiza o link simbólico da aplicação para o diretório da nova release
    """
    with cd(env.project_path):
        with settings(hide('warnings', 'stdout', 'stderr'),
                      warn_only=True):
            sudo('rm -f previous')
            sudo('mv -f current previous')
            
    with cd(env.project_path):
        sudo('ln -s releases/%s current' % (env.release))    
        
    __green(u'Link simbólico atualizado para nova release')

def __install_site():
    """
    Instala os arquivos de configuração no supervisor, monit, nginx, logrotate,
    etc
    """
    # Supervisor
    sudo('mv -f %s/releases/%s/conf/supervisor/*.conf ' 
         ' /etc/supervisor/conf.d/' % (env.project_path, env.release))
    
    sudo('supervisorctl -c /etc/supervisor/supervisord.conf reread')
    sudo('supervisorctl -c /etc/supervisor/supervisord.conf update')
    
    # Monit
    sudo('mv -f %s/releases/%s/conf/monit/*.conf '
         '/etc/monit/conf.d/'  % (env.project_path, env.release))
    sudo('/etc/init.d/monit restart')    
    
    # Nginx    
    sudo('mv -f {0}/releases/{1}/conf/nginx/{2}.conf '
         ' /etc/nginx/sites-available/{2}'.format(env.project_path, 
                                                  env.release, 
                                                  env.project_name))
        
    with settings(hide('warnings', 'stdout', 'stderr'), warn_only=True):
        sudo('unlink /etc/nginx/sites-enabled/default')
        sudo('ln -s /etc/nginx/sites-available/{0} /etc/nginx/sites-enabled/{0}'.format(env.project_name))

    # Log Rotate
    with settings(hide('warnings', 'stdout', 'stderr'), warn_only=True):
        with cd(env.project_path):
            sudo('mv -f %s/releases/%s/conf/logrotate/* ' 
                 '/etc/logrotate.d/' % (env.project_path, env.release))
    sudo('chmod 644 /etc/logrotate.d/*') # Must ensure permission
    
    __green(u'Todas as configurações foram instaladas')
    
def setup_py_pkgs():
    """
    Cria o diretório virtual para o Python e instala todos os pacotes Python    
    """
    deps_folder = env.project_path + '/current/deps/'
    install_cmd = 'env/bin/pip install -r {0}/current/requirements.txt'.format(env.project_path)
    
    with cd(env.project_path):
        if not exists('env'):
            sudo('virtualenv --no-site-packages env')
        else:
            __green(u'virtualenv já existe, continuando...')  
    
        run('source env/bin/activate')
        
        # Attempts to install first from local folder and then from the internet 
        sudo(install_cmd + ' --no-index --find-links ' + deps_folder, warn_only=True)
        sudo(install_cmd)

    __green(u'Instaladas as dependências do Python')

def setup():
    """
    Configura o diretório virtual para o Python e algumas outras pastas úteis
    """    
    sudo('mkdir -p %s' % (env.project_path))
    sudo('chown -R %s %s' % (env.deploy_user, env.project_path))
    with cd(env.project_path):
        sudo('mkdir -p releases')
        sudo('mkdir -p packages')
        sudo('mkdir -p logs')
        sudo('chown -R %s %s' % (env.deploy_user, env.project_path))    
        
    __green(u'Diretórios básicos criados')
        
def reload_nginx():
    """
    Recarrega o NGINX
    """
    err = StringIO()    
    
    sudo('nginx -s reload', stderr=err, warn_only=True, combine_stderr=True, 
         stdout=None)
    
    err_value = err.getvalue()
    
    if err_value:        
        __red(err_value)
        __red(u"Falha ao recarregar o NGINX, tentando iniciá-lo...")
        sudo('/etc/init.d/nginx start')
    else:
        __green('NGINX recarregado')
        
def clean_old_releases():
    """
    Remove as releases antigas para economizar espaço em disco
    """    
    with cd(env.project_path):        
        releases = run('ls -tx1 releases/')        
        for i, release in enumerate(releases.split()):
            if i > 3: # Guarda as últimas 4 releases
                sudo('rm -rf releases/%s' % release)
                __green('Removida antiga release %s' % release)        
        
def deploy(branch=None):
    """
    Faz o deploy do servidor de aplicação
    """    
    env.release = time.strftime('%Y%m%d%H%M%S')
    
    __upload_tar_from_git(branch=branch)
    __symlink_current_release()
    __install_site()
    reload_nginx()
    
    # Clear Packages
    sudo('rm -f %s/packages/*' % (env.project_path))
    
    clean_old_releases()        
    
    __green(u'Deploy completado!')

def start():
    """
    Inicia o daemon do supervisor
    """
    sudo('supervisorctl -c /etc/supervisor/supervisord.conf start cemigsaude_uwsgi:*')

def stop():
    """
    Finaliza o daemon do supervisor
    """
    sudo('supervisorctl -c /etc/supervisor/supervisord.conf stop cemigsaude_uwsgi:*')
    
def restart():
    """
    Reiniciar o daemon do supervisor
    """
    stop()
    start()    
    __green(u'Supervisor reiniciado')

                
