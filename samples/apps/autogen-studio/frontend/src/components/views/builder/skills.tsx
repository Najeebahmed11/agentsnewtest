import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Input, Modal, message, MenuProps, Dropdown } from "antd";
import * as React from "react";
import { ISkill, IStatus } from "../../types";
import { appContext } from "../../../hooks/provider";
import {
  fetchJSON,
  getSampleSkill,
  getServerUrl,
  sanitizeConfig,
  timeAgo,
  truncateText,
} from "../../utils";
import {
  BounceLoader,
  Card,
  CardHoverBar,
  LoadingOverlay,
  MonacoEditor,
} from "../../atoms";

const SkillsView = ({}: any) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<IStatus | null>({
    status: true,
    message: "All good",
  });

  const { user } = React.useContext(appContext);
  const serverUrl = getServerUrl();
  const listSkillsUrl = `${serverUrl}/skills?user_id=${user?.email}`;
  const saveSkillsUrl = `${serverUrl}/skills`;
  const deleteSkillsUrl = `${serverUrl}/skills/delete`;

  const [skills, setSkills] = React.useState<ISkill[] | null>([]);
  const [selectedSkill, setSelectedSkill] = React.useState<any>(null);

  const [showSkillModal, setShowSkillModal] = React.useState(false);
  const [showNewSkillModal, setShowNewSkillModal] = React.useState(false);

  const sampleSkill = getSampleSkill();
  const [newSkill, setNewSkill] = React.useState<ISkill | null>(sampleSkill);

  const deleteSkill = (skill: ISkill) => {
    console.log('Initiating deletion of skill:', skill.id); // More specific about what's being deleted

    setError(null);
    setLoading(true);

    const payLoad = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.email,
        skill: skill,
      }),
    };

    console.log('Delete payload prepared for skill:', skill.id, payLoad); // Show payload for debugging

    const onSuccess = (data: any) => {
      console.log('Response from delete skill API:', data); // Log entire response to understand structure

      if (data && data.status) {
        message.success(data.message);
        setSkills(data.data);
        console.log('Skill deletion successful, updated skills list:', data.data); // Confirm successful deletion and show updated list
      } else {
        message.error(data.message);
        console.log('Failed to delete skill:', data.message); // Provide reason for failure from the API
      }
      setLoading(false);
    };

    const onError = (err: any) => {
      console.error('Error during delete skill request:', err); // Use console.error to highlight errors
      setError(err);
      message.error(err.message);
      setLoading(false);
    };

    console.log('Sending delete request for skill:', skill.id); // Log the action of sending the request
    fetchJSON(deleteSkillsUrl, payLoad, onSuccess, onError);
};


  const fetchSkills = () => {
    setError(null);
    setLoading(true);
    // const fetch;
    const payLoad = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const onSuccess = (data: any) => {
      if (data && data.status) {
        // message.success(data.message);
        // console.log("skills", data.data);
        setSkills(data.data);
      } else {
        message.error(data.message);
      }
      setLoading(false);
    };
    const onError = (err: any) => {
      setError(err);
      message.error(err.message);
      setLoading(false);
    };
    fetchJSON(listSkillsUrl, payLoad, onSuccess, onError);
  };

  const saveSkill = (skill: ISkill) => {
    setError(null);
    setLoading(true);
    // const fetch;
    const payLoad = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user?.email,
        skill: skill,
      }),
    };

    const onSuccess = (data: any) => {
      if (data && data.status) {
        message.success(data.message);
        // console.log("skills", data.data);
        setSkills(data.data);
      } else {
        message.error(data.message);
      }
      setLoading(false);
    };
    const onError = (err: any) => {
      setError(err);
      message.error(err.message);
      setLoading(false);
    };
    fetchJSON(saveSkillsUrl, payLoad, onSuccess, onError);
  };

  React.useEffect(() => {
    if (user) {
      // console.log("fetching messages", messages);
      fetchSkills();
    }
  }, []);

  const skillRows = (skills || []).map((skill: ISkill, i: number) => {
    const cardItems = [
      {
        title: "Download",
        icon: ArrowDownTrayIcon,
        onClick: (e: any) => {
          e.stopPropagation();
          // download workflow as workflow.name.json
          const element = document.createElement("a");
          const sanitizedSkill = sanitizeConfig(skill);
          const file = new Blob([JSON.stringify(sanitizedSkill)], {
            type: "application/json",
          });
          element.href = URL.createObjectURL(file);
          element.download = `skill_${skill.title}.json`;
          document.body.appendChild(element); // Required for this to work in FireFox
          element.click();
        },
        hoverText: "Download",
      },
      {
        title: "Make a Copy",
        icon: DocumentDuplicateIcon,
        onClick: (e: any) => {
          e.stopPropagation();
          let newSkill = { ...skill };
          newSkill.title = `${skill.title} Copy`;
          newSkill.user_id = user?.email;
          newSkill.timestamp = new Date().toISOString();
          if (newSkill.id) {
            delete newSkill.id;
          }
          setNewSkill(newSkill);
          setShowNewSkillModal(true);
        },
        hoverText: "Make a Copy",
      },
      {
        title: "Delete",
        icon: TrashIcon,
        onClick: (e: any) => {
          e.stopPropagation();
          deleteSkill(skill);
        },
        hoverText: "Delete",
      },
    ];
    return (
      <div key={"skillrow" + i} className=" " style={{ width: "200px" }}>
        <div>
          {" "}
          <Card
            className="h-full p-2 cursor-pointer group"
            title={truncateText(skill.title, 25)}
            onClick={() => {
              setSelectedSkill(skill);
              setShowSkillModal(true);
            }}
          >
            <div style={{ minHeight: "65px" }} className="my-2   break-words">
              {" "}
              {truncateText(skill.content, 70)}
            </div>
            <div className="text-xs">{timeAgo(skill.timestamp || "")}</div>
            <CardHoverBar items={cardItems} />
          </Card>
          <div className="text-right mt-2"></div>
        </div>
      </div>
    );
  });

  const SkillModal = ({
    skill,
    setSkill,
    showSkillModal,
    setShowSkillModal,
    handler,
  }: {
    skill: ISkill | null;
    setSkill: any;
    showSkillModal: boolean;
    setShowSkillModal: any;
    handler: any;
  }) => {
    const editorRef = React.useRef<any | null>(null);
    const [localSkill, setLocalSkill] = React.useState<ISkill | null>(skill);
    return (
      <Modal
        title={
          <>
            Skill Specification{" "}
            <span className="text-accent font-normal">{localSkill?.title}</span>{" "}
          </>
        }
        width={800}
        open={showSkillModal}
        onCancel={() => {
          setShowSkillModal(false);
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setShowSkillModal(false);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => {
              setShowSkillModal(false);
              if (editorRef.current) {
                const value = editorRef.current.getValue();
                const updatedSkill = { ...localSkill, content: value };
                setSkill(updatedSkill);
                handler(updatedSkill);
              }
            }}
          >
            Save
          </Button>,
        ]}
      >
        {localSkill && (
          <div style={{ minHeight: "70vh" }}>
            <div className="mb-2">
              <Input
                placeholder="Skill Title"
                value={localSkill.title}
                onChange={(e) => {
                  const updatedSkill = { ...localSkill, title: e.target.value };
                  setLocalSkill(updatedSkill);
                }}
              />
            </div>

            {/* <div className="mb-2">
              <div className="inline-block  "> Skill Description </div>
              <TextArea
                placeholder="Skill Description"
                value={localSkill.description}
                onChange={(e) => {
                  const updatedSkill = {
                    ...localSkill,
                    description: e.target.value,
                  };
                  setLocalSkill(updatedSkill);
                }}
              />
            </div> */}

            <div style={{ height: "70vh" }} className="h-full  mt-2 rounded">
              <MonacoEditor
                value={localSkill?.content}
                language="python"
                editorRef={editorRef}
              />
            </div>
          </div>
        )}
      </Modal>
    );
  };

  const uploadSkill = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (content) {
          try {
            const skill = JSON.parse(content as string);
            if (skill) {
              setNewSkill(skill);
              setShowNewSkillModal(true);
            }
          } catch (e) {
            message.error("Invalid skill file");
          }
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const skillsMenuItems: MenuProps["items"] = [
    // {
    //   type: "divider",
    // },
    {
      key: "uploadskill",
      label: (
        <div>
          <ArrowUpTrayIcon className="w-5 h-5 inline-block mr-2" />
          Upload Skill
        </div>
      ),
    },
  ];

  const skillsMenuItemOnClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "uploadskill") {
      uploadSkill();
      return;
    }
  };

  return (
    <div className=" text-primary ">
      <SkillModal
        skill={selectedSkill}
        setSkill={setSelectedSkill}
        showSkillModal={showSkillModal}
        setShowSkillModal={setShowSkillModal}
        handler={(skill: ISkill) => {
          saveSkill(skill);
        }}
      />

      <SkillModal
        skill={newSkill}
        setSkill={setNewSkill}
        showSkillModal={showNewSkillModal}
        setShowSkillModal={setShowNewSkillModal}
        handler={(skill: ISkill) => {
          saveSkill(skill);
        }}
      />

      <div className="mb-2   relative">
        <div className="">
          <div className="flex mt-2 pb-2 mb-2 border-b">
            <div className="flex-1   font-semibold mb-2 ">
              {" "}
              Skills ({skillRows.length}){" "}
            </div>
            <div>
              <Dropdown.Button
                type="primary"
                menu={{
                  items: skillsMenuItems,
                  onClick: skillsMenuItemOnClick,
                }}
                placement="bottomRight"
                trigger={["click"]}
                onClick={() => {
                  setShowNewSkillModal(true);
                }}
              >
                <PlusIcon className="w-5 h-5 inline-block mr-1" />
                New Skill
              </Dropdown.Button>
            </div>
          </div>
          <div className="text-xs mb-2 pb-1  ">
            {" "}
            Skills are python functions that agents can use to solve tasks.{" "}
          </div>
          {skills && skills.length > 0 && (
            <div
              // style={{ height: "400px" }}
              className="w-full  relative"
            >
              <LoadingOverlay loading={loading} />
              <div className="   flex flex-wrap gap-3">{skillRows}</div>
            </div>
          )}

          {skills && skills.length === 0 && !loading && (
            <div className="text-sm border mt-4 rounded text-secondary p-2">
              <InformationCircleIcon className="h-4 w-4 inline mr-1" />
              No skills found. Please create a new skill.
            </div>
          )}
          {loading && (
            <div className="  w-full text-center">
              {" "}
              <BounceLoader />{" "}
              <span className="inline-block"> loading .. </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillsView;
