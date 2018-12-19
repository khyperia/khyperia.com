Installing RAMS locally
===

* Install python 3 and sqlite or postgresql
* Install (via package manager or `pip install --user`): virtualenv, paver
* `git clone git@github.com:magfest/sideboard.git`
* `cd sideboard`
* `git clone git@github.com:magfest/ubersystem.git plugins/uber`
    * (the above *must* be a dir named uber, not ubersystem)
* if needed, `unset CC` `unset CXX` (gcc required, not clang)
* `paver make_venv` (may be at `~/.local/bin/paver`, depending on install)
* `source ./env/bin/activate`
* `paver install_deps`
* Init the DB, and create test admin account: `sep reset_uber_db`
* Run the stuff and the things! `python sideboard/run_server.py`
* RAMS is now running on `localhost:8282`!

DB init:

```
$ sudo -u postgres -i
$ initdb -D '/var/lib/postgres/data'
$ systemctl start postgresql
$ createuser --interactive
$ psql
> \password
> \q
$ createdb db_name -O db_user

development.ini:

```
path = "/uber"
[secret]
sqlalchemy_url = "postgresql://db_user:db_password@localhost:5432/db_name"
```
