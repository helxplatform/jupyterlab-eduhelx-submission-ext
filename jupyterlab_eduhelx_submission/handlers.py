import json
import os
import requests
import subprocess
import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from pathlib import Path
from .config import ExtensionConfig
from .api import Api
from .git import InvalidGitRepositoryException, get_remote, get_repo_root
from .process import execute
from ._version import __version__

class BaseHandler(APIHandler):
    @property
    def config(self) -> ExtensionConfig:
        return ExtensionConfig(self.serverapp)

    @property
    def api(self) -> Api:
        return Api(self.config)


class CourseAndStudentHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        student = self.api.get_student()
        course = self.api.get_course()
        self.finish(json.dumps({
            "student": student,
            "course": course
        }))

class AssignmentsHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        current_path: str = self.get_argument("path")
        current_path_abs = os.path.realpath(current_path)

        student = self.api.get_student()
        assignments = self.api.get_assignments(student["student_onyen"])
        course = self.api.get_course()

        value = {
            "current_assignment": None,
            "assignments": None
        }

        try:
            master_repo_remote = get_remote(
                name="upstream",
                path=current_path_abs
            )
            repo_root = get_repo_root(current_path_abs)
            repo_root_abs = os.path.realpath(repo_root)
        except InvalidGitRepositoryException:
            # Not in the student's class repo, so not in an assignment.
            self.finish(json.dumps(value))
            return

        # Confirm that the student's current repo is a fork of the class's master repo.
        if master_repo_remote != course["master_remote_url"]:
            self.finish(json.dumps(value))
            return

        # Add absolute path to assignment so that the frontend
        # extension knows how to open the assignment without having
        # to know the repository root.
        for assignment in assignments:
            # The frontend can only access files under directory where the Jupyter server is running,
            # so we need to make sure the "absolute" path is actually relative to the Jupyter server
            cwd = os.getcwd()
            rel_assignment_path = os.path.relpath(
                os.path.join(repo_root_abs, assignment["directory_path"]),
                cwd
            )
            # The cwd is the root in the frontend, so treat the path as such.
            assignment["absolute_directory_path"] = os.path.join("/", rel_assignment_path)
        value["assignments"] = assignments

        # The student is in their repo, but we still need to check if they're actually in an assignment directory.
        current_assignment = None
        for assignment in assignments:
            assignment_path = Path(os.path.join(
                repo_root_abs,
                assignment["directory_path"]
            ))
            if assignment_path == Path(current_path_abs) or assignment_path in Path(current_path_abs).parents:
                current_assignment = assignment
                break

        if current_assignment is not None:
            submissions = self.api.get_assignment_submissions(current_assignment["id"], student["student_onyen"], git_path=current_path_abs)
            current_assignment["submissions"] = submissions

            value["current_assignment"] = current_assignment
            self.finish(json.dumps(value))
        else:
            self.finish(json.dumps(value))
            

class SubmissionHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        res = requests.post(f"{ self.config.GRADER_API_URL }api/v1/submission", params={
            "onyen": None,
            "commit_id": None
        })
        self.set_status(res.status_code)
        self.finish(res.text)

class SettingsHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        server_version = str(__version__)

        self.finish(json.dumps({
            "serverVersion": server_version
        }))


def setup_handlers(server_app):
    web_app = server_app.web_app
    
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    handlers = [
        ("assignments", AssignmentsHandler),
        ("course_student", CourseAndStudentHandler),
        ("submission", SubmissionHandler),
        ("settings", SettingsHandler)
    ]
    handlers_with_path = [
        (
            url_path_join(base_url, "jupyterlab-eduhelx-submission", uri),
            handler
        ) for (uri, handler) in handlers
    ]
    web_app.add_handlers(host_pattern, handlers_with_path)
