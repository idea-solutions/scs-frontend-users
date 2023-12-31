import React from "react";
import "../../User/assets/css/profile.css";

import { AuthContext } from "../../../../contexts/AuthContext";

import { lazy, Suspense, useCallback, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "../../../layouts/Loading";
import { toast$, user$ } from "../../../../redux/selectors";

import Swal from "sweetalert2";

import ChangeAvatar from "./ChangeAvatar";
import ChangePasswordForm from "./ChangePasswordForm";
import axios from "axios";
import { apiURL } from "../../../../api";
import { QRCodeSVG } from "qrcode.react";
const AlertMessage = lazy(() => import("../../../layouts/AlertMessage"));

const Profile = () => {
    const {
        authState: { user, isAuthenticated, authLoading, isLoveKitchen },
        loadUser,
    } = useContext(AuthContext);

    let dateString = "";
    if (user) {
        const isoTimestamp = user?.data?.birthday?.toString();
        dateString = isoTimestamp?.substring(0, 10);
    }
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const toast = useSelector(toast$);
    const [alert, setAlert] = useState(null);

    //===============================================
    const [isChecked, setIsChecked] = useState();

    const [freeTime, setFreeTime] = useState({
        startDay: "",
        endDay: "",
    });

    const { startDay, endDay } = freeTime;

    var today = new Date().toISOString().split("T")[0];

    const [hiddenFreeTime, setHiddenFreeTime] = useState();

    const onChangeFreeTime = useCallback(
        (event) => {
            setFreeTime({ ...freeTime, [event.target.name]: event.target.value });
        },
        [freeTime],
    );

    //========================================================

    const [newInfo, setNewInfo] = useState({
        email: "",
        fullName: "",
        gender: "",
        birthday: "",
        phone: "",
        address: "",
        isBusyVolunteer: user?.data?.isBusyVolunteer,
    });

    const { email, fullName, gender, birthday, phone, address } = newInfo;

    const [isDisableSubmit, setIsDisableSubmit] = useState(true);
    if (!authLoading && !isAuthenticated) {
        navigate(`/login?RedirectTo=${location.pathname}${location.search}`);
    }

    const clearData = useCallback(() => {
        setNewInfo({
            email: user?.data?.email || "",
            fullName: user?.data?.fullName || "",
            gender: user?.data?.gender || "",
            birthday: dateString || "",
            phone: user?.data?.phone || "",
            address: user?.data?.address || "",
            isBusyVolunteer: user?.data?.isBusyVolunteer || false,
        });
        setFreeTime({
            startDay: user?.data?.freeTime?.[0]?.substring(0, 10),
            endDay: user?.data?.freeTime?.[1]?.substring(0, 10),
        });

        if (user?.data?.isActiveVolunteer === false || user?.data?.isBusyVolunteer === true) {
            setHiddenFreeTime(true);
            setIsChecked(false);
        } else {
            setHiddenFreeTime(false);

            setIsChecked(true);
        }
    }, [
        user?.data?.fullName,
        user?.data?.gender,
        user?.data?.birthday,
        user?.data?.phone,
        user?.data?.address,
        user?.data?.freeTime,
        user?.data?.isBusyVolunteer,
    ]);

    useEffect(() => {
        console.log(hiddenFreeTime);
        hiddenFreeTime ? setIsChecked(false) : setIsChecked(true);
    }, [hiddenFreeTime]);

    useEffect(
        () => async () => {
            await loadUser();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [authLoading],
    );

    useEffect(() => {
        clearData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadUser]);

    const onChangeData = useCallback(
        (event) => {
            setNewInfo({ ...newInfo, [event.target.name]: event.target.value });
        },
        [newInfo],
    );

    const onChangeRegisterFreeTime = () => {
        setNewInfo({ ...newInfo, isBusyVolunteer: !hiddenFreeTime });
        setHiddenFreeTime(!hiddenFreeTime);
        // if (!hiddenFreeTime) {
        //     setFreeTime({ startDay: "", endDay: "" });
        // }
    };

    const compareDate = (d1, d2) => {
        if (new Date(d1).getTime() > new Date(d2).getTime()) {
            Swal.fire("Thông báo!", "Ngày kết thúc phải lớn hơn ngày bắt đầu!", "warning");
            return false;
        } else {
            return true;
        }
    };

    useEffect(() => {
        if (
            (newInfo.fullName === user?.data?.fullName &&
                newInfo.phone === user?.data?.phone &&
                newInfo.address === user?.data?.address &&
                newInfo.gender === user?.data?.gender &&
                newInfo.birthday === dateString &&
                newInfo.isBusyVolunteer === user?.data?.isBusyVolunteer &&
                freeTime.startDay === user?.data?.freeTime?.[0]?.substring(0, 10) &&
                freeTime.endDay === user?.data?.freeTime?.[1]?.substring(0, 10)) ||
            (freeTime.startDay && !freeTime.endDay) ||
            (!freeTime.startDay && freeTime.endDay) ||
            (hiddenFreeTime === false && freeTime.startDay === "" && freeTime.endDay === "") ||
            !compareDate(freeTime.startDay, freeTime.endDay)
        ) {
            setIsDisableSubmit(true);
        } else {
            setIsDisableSubmit(false);
        }
    }, [newInfo, freeTime]);

    const onSubmit = useCallback(
        async (event) => {
            event.preventDefault();

            if (
                newInfo.fullName === user?.data?.fullName &&
                newInfo.phone === user?.data?.phone &&
                newInfo.address === user?.data?.address &&
                newInfo.gender === user?.data?.gender &&
                newInfo.birthday === dateString &&
                newInfo.isBusyVolunteer === user?.data?.isBusyVolunteer &&
                freeTime.startDay === user?.data?.freeTime?.[0]?.substring(0, 10) &&
                freeTime.endDay === user?.data?.freeTime?.[1]?.substring(0, 10)
            ) {
                setIsDisableSubmit(true);
                return;
            }
            if (!fullName || !phone) {
                setIsDisableSubmit(false);
                setAlert({
                    type: "warning",
                    message: "completeInfo",
                });
                setTimeout(() => setAlert(null), 5000);
                return;
            }
            setAlert(null);
            if (newInfo.birthday !== "") {
                newInfo.birthday = birthday?.toString() + "T00:00:00.000Z";
            } else {
            }

            try {
                const resUpdateUser = await axios.patch(`${apiURL}/auth/profiles`, {
                    ...newInfo,
                    isActive: true,
                    birthday: newInfo.birthday === "" ? undefined : newInfo.birthday,
                    freeTime:
                        freeTime.startDay !== ""
                            ? [
                                  freeTime.startDay.toString() + "T00:00:00.000Z",
                                  freeTime.endDay.toString() + "T00:00:00.000Z",
                              ]
                            : [],
                });
                if (resUpdateUser.data) {
                    Swal.fire({
                        position: "top-center",
                        icon: "success",
                        title: "Thông Báo!",
                        text: "Cập nhật thành công!",
                        showConfirmButton: true,
                        timer: 5000,
                    }).then(() => {
                        window.location.reload(true);
                    });
                    setTimeout(() => {
                        window.location.reload(true);
                    }, 5000);
                }
            } catch (error) {
                if (newInfo.birthday.length > 10) {
                    const isoTimestamp = newInfo.birthday.toString();
                    newInfo.birthday = isoTimestamp?.substring(0, 10);
                }
                if (error.response.status == 400)
                    Swal.fire({
                        position: "top-center",
                        icon: "error",
                        title: "Thông Báo!",
                        text: "Số điện thoại này đã tồn tại!",
                        showConfirmButton: true,
                        timer: 3000,
                    });
                else
                    Swal.fire({
                        position: "top-center",
                        icon: "error",
                        title: "Thông Báo!",
                        text: "Lỗi máy chủ, vui lòng thử lại sau!",
                        showConfirmButton: true,
                        timer: 3000,
                    });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            address,
            dispatch,
            fullName,
            newInfo,
            phone,
            toast?.type,
            user?.data?.address,
            user?.data?.fullName,
            user?.data?.id,
            user?.data?.phone,
            freeTime.startDay,
            freeTime.endDay,
        ],
    );

    console.log(newInfo);
    return (
        <>
            <div
                style={{
                    background:
                        "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(../img/page-header.jpg)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    paddingBottom: "40px",
                }}
                className="profile"
            >
                <div className="page-header" style={{ padding: "65px", background: "unset" }}>
                    <div className="container">
                        <div className="row"></div>
                    </div>
                </div>
                <div
                    className="container rounded bg-white mt-5 mb-5"
                    style={{ fontFamily: `"Comic Sans MS", "Poppins-Regular", "Arial", "Times"` }}
                >
                    <div className="row">
                        <div
                            className="col-md-4 border-right"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div className="d-flex flex-column align-items-center text-center p-3 py-5 info-account">
                                <ChangeAvatar />

                                <ChangePasswordForm />

                                <QRCodeSVG
                                    style={{ marginTop: 30 }}
                                    value={
                                        user &&
                                        `<Thông Tin Người Dùng>\nHọ tên: ${
                                            user?.data?.fullName
                                        } \nSĐT: ${user?.data?.phone} \nEmail: ${
                                            user?.data?.email
                                        } \nĐịa chỉ: ${
                                            user?.data?.address
                                        } \nNgày sinh: ${new Intl.DateTimeFormat("en-US", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                        }).format(new Date(user?.data?.birthday))} \nGiới tính: ${
                                            user?.data?.gender === "male"
                                                ? "Nam"
                                                : user?.data?.gender === "female"
                                                ? "Nữ"
                                                : "Khác"
                                        }`
                                    }
                                />
                            </div>
                        </div>
                        <div className="col-md-8 border-right">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                }}
                            >
                                <div className="p-4 py-5">
                                    <div className="d-flex justify-content-center align-items-center mb-3">
                                        <h4 className="text-right">Thông Tin Tài Khoản</h4>
                                    </div>
                                    <div className="row mt-3">
                                        {alert && (
                                            <Suspense fallback={<Loading hidden={false} />}>
                                                <AlertMessage info={alert} />
                                            </Suspense>
                                        )}
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Họ tên</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="fullName"
                                                value={fullName}
                                                onChange={onChangeData}
                                            />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Email</label>
                                            <input
                                                disabled
                                                style={{
                                                    background: "#f5f5f5a6",
                                                }}
                                                type="email"
                                                className="form-control"
                                                value={email}
                                            />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Số điện thoại</label>
                                            <input
                                                type="text"
                                                maxLength={10}
                                                className="form-control"
                                                name="phone"
                                                value={phone}
                                                onChange={onChangeData}
                                            />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Địa chỉ</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="address"
                                                value={address}
                                                onChange={onChangeData}
                                            />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Ngày sinh</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="birthday"
                                                value={birthday}
                                                onChange={onChangeData}
                                            />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">Giới tính</label>
                                            <select
                                                name="gender"
                                                id="gender"
                                                style={{ borderRadius: 10, padding: 3 }}
                                                value={gender}
                                                onChange={onChangeData}
                                            >
                                                <option value="male">Nam</option>
                                                <option value="female">Nữ</option>
                                                <option value="unknown">Khác </option>
                                            </select>
                                        </div>
                                    </div>
                                    {!isLoveKitchen ? (
                                        <>
                                            {" "}
                                            <hr />
                                            <div className="col-md-12" style={{ marginTop: 15 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "left",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <input
                                                        disabled={!user?.data?.isActiveVolunteer}
                                                        id="freeTime"
                                                        type="checkbox"
                                                        defaultChecked={isChecked}
                                                        onClick={onChangeRegisterFreeTime}
                                                        style={{ width: 20, cursor: "pointer" }}
                                                    />
                                                    <label
                                                        htmlFor="freeTime"
                                                        style={{
                                                            cursor: "pointer",
                                                            paddingLeft: 10,
                                                        }}
                                                    >
                                                        Đăng ký tình nguyện viên
                                                    </label>
                                                </div>
                                                <label
                                                    htmlFor="freeTime"
                                                    style={{
                                                        cursor: "pointer",
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    {user?.data?.isActiveVolunteer ? (
                                                        <></>
                                                    ) : (
                                                        <div
                                                            style={{
                                                                color: "red",
                                                                fontStyle: "italic",
                                                                fontSize: 14,
                                                            }}
                                                        >
                                                            (Bạn đã bị cấm đăng ký tình nguyện viên
                                                            vì vi phạm!)
                                                        </div>
                                                    )}
                                                </label>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    <label> Thời Gian Rảnh:</label>
                                                    <input
                                                        min={today}
                                                        name="startDay"
                                                        type="date"
                                                        style={{
                                                            width: 170,
                                                            // cursor: "pointer",
                                                            textAlign: "center",
                                                        }}
                                                        value={startDay}
                                                        onChange={onChangeFreeTime}
                                                        disabled={!isChecked}
                                                    />
                                                    ~
                                                    <input
                                                        min={today}
                                                        name="endDay"
                                                        type="date"
                                                        style={{
                                                            width: 170,
                                                            // cursor: "pointer",
                                                            textAlign: "center",
                                                        }}
                                                        value={endDay}
                                                        onChange={onChangeFreeTime}
                                                        disabled={!isChecked}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <></>
                                    )}

                                    <div className="mt-5 text-center">
                                        <button
                                            onClick={onSubmit}
                                            className="btn btn-primary profile-button"
                                            type="button"
                                            disabled={isDisableSubmit}
                                        >
                                            Save Profile
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
