import { useContext, useEffect, useState } from "react";
import {
  TextField,
  Button,
  CheckboxField,
  SelectField,
} from "@renderer/components";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@renderer/hooks";
import { changeLanguage } from "i18next";
import languageResources from "@locales";
import { orderBy } from "lodash-es";
import { settingsContext } from "@renderer/context";
import "./settings-general.scss";

interface LanguageOption {
  option: string;
  nativeName: string;
}

export function SettingsGeneral() {
  const { t } = useTranslation("settings");

  const { updateUserPreferences } = useContext(settingsContext);

  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [form, setForm] = useState({
    downloadsPath: "",
    downloadNotificationsEnabled: false,
    repackUpdatesNotificationsEnabled: false,
    achievementNotificationsEnabled: false,
    friendRequestNotificationsEnabled: false,
    language: "",

    customStyles: window.localStorage.getItem("customStyles") || "",
  });

  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([]);

  const [defaultDownloadsPath, setDefaultDownloadsPath] = useState("");

  useEffect(() => {
    window.electron.getDefaultDownloadsPath().then((path) => {
      setDefaultDownloadsPath(path);
    });

    setLanguageOptions(
      orderBy(
        Object.entries(languageResources).map(([language, value]) => {
          return {
            nativeName: value.language_name,
            option: language,
          };
        }),
        ["nativeName"],
        "asc"
      )
    );
  }, []);

  useEffect(() => {
    if (userPreferences) {
      const languageKeys = Object.keys(languageResources);
      const language =
        languageKeys.find(
          (language) => language === userPreferences.language
        ) ??
        languageKeys.find((language) => {
          return language.startsWith(
            userPreferences.language?.split("-")[0] ?? "en"
          );
        });

      setForm((prev) => ({
        ...prev,
        downloadsPath: userPreferences.downloadsPath ?? defaultDownloadsPath,
        downloadNotificationsEnabled:
          userPreferences.downloadNotificationsEnabled ?? false,
        repackUpdatesNotificationsEnabled:
          userPreferences.repackUpdatesNotificationsEnabled ?? false,
        achievementNotificationsEnabled:
          userPreferences.achievementNotificationsEnabled ?? false,
        friendRequestNotificationsEnabled:
          userPreferences.friendRequestNotificationsEnabled ?? false,
        language: language ?? "en",
      }));
    }
  }, [userPreferences, defaultDownloadsPath]);

  const handleLanguageChange = (event) => {
    const value = event.target.value;

    handleChange({ language: value });
    changeLanguage(value);
  };

  const handleChange = (values: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...values }));
    updateUserPreferences(values);
  };

  const handleChooseDownloadsPath = async () => {
    const { filePaths } = await window.electron.showOpenDialog({
      defaultPath: form.downloadsPath,
      properties: ["openDirectory"],
    });

    if (filePaths && filePaths.length > 0) {
      const path = filePaths[0];
      handleChange({ downloadsPath: path });
    }
  };

  return (
    <div className="settings-general">
      <TextField
        label={t("downloads_path")}
        value={form.downloadsPath}
        readOnly
        disabled
        rightContent={
          <Button theme="outline" onClick={handleChooseDownloadsPath}>
            {t("change")}
          </Button>
        }
      />

      <SelectField
        label={t("language")}
        value={form.language}
        onChange={handleLanguageChange}
        options={languageOptions.map((language) => ({
          key: language.option,
          value: language.option,
          label: language.nativeName,
        }))}
      />

      <p className="settings-general__notifications-title">
        {t("notifications")}
      </p>

      <CheckboxField
        label={t("enable_download_notifications")}
        checked={form.downloadNotificationsEnabled}
        onChange={() =>
          handleChange({
            downloadNotificationsEnabled: !form.downloadNotificationsEnabled,
          })
        }
      />

      <CheckboxField
        label={t("enable_repack_list_notifications")}
        checked={form.repackUpdatesNotificationsEnabled}
        onChange={() =>
          handleChange({
            repackUpdatesNotificationsEnabled:
              !form.repackUpdatesNotificationsEnabled,
          })
        }
      />

      <CheckboxField
        label={t("enable_achievement_notifications")}
        checked={form.achievementNotificationsEnabled}
        onChange={() =>
          handleChange({
            achievementNotificationsEnabled:
              !form.achievementNotificationsEnabled,
          })
        }
      />

      <CheckboxField
        label={t("enable_friend_request_notifications")}
        checked={form.friendRequestNotificationsEnabled}
        onChange={() =>
          handleChange({
            friendRequestNotificationsEnabled:
              !form.friendRequestNotificationsEnabled,
          })
        }
      />
    </div>
  );
}
